import { request as rpc } from './rpc';
import { knex } from './knex';
import { collate } from './collate';

let mempoolReadings = [];

// Keep this small as it is broadcast
export const status = {
  time: null,
  jobsInErrorCount: 0,
  height: {
    bitcoind: null,
    overnode: null,
    peers: null,
  },
  mempool: {
    txCount: null,
    txPerSecond: null,
    bytes: null,
  },
};

async function main() {
  // Get required data from bitcoind
  const info = await rpc('getinfo');
  const mempool = await rpc('getmempoolinfo');
  const peers = await rpc('getpeerinfo');

  // Set server time for data age
  status.time = new Date();

  // Get number of jobs in error
  const [{ count }] = await knex('job').count('id').whereNotNull('error_message');
  status.jobsInErrorCount = Number(count);

  // Keep core status information in importable variable for other processes
  status.height.bitcoind = info.blocks;
  status.mempool.bytes = mempool.bytes;
  status.mempool.txCount = mempool.size;

  // Collect count of height value for peers
  const peerHeights = [];
  peers.forEach((peer) => {
    const index = peerHeights
      .findIndex(rec => rec.height === peer.synced_blocks);
    if (index < 0) {
      peerHeights.push({ height: peer.synced_blocks, count: 1 });
    } else {
      peerHeights[index].count++;
    }
  });

  // Get most common peer height
  const [commonHeight] = peerHeights.sort((a, b) => a.count < b.count);
  status.height.peers = commonHeight.height;

  // Get the highest block we have fully synced to the database
  const [{ min }] = await knex('job').min('height').select();
  status.height.overnode = min;

  // If database is behind bitcoind, trigger collate job
  if (status.height.bitcoind > status.height.overnode) {
    const fromHeight = status.height.overnode;
    let toHeight = fromHeight + Number(process.env.COLLATION_JOB_CHUNK_SIZE);
    if (toHeight > status.height.bitcoind) {
      toHeight = status.height.bitcoind;
    }
    await collate(fromHeight, toHeight);
  }

  // Store mempool tx count readings - about 1 a second
  let latestReading;
  let timeSinceLastStored = 0;
  if (mempoolReadings.length) {
    latestReading = mempoolReadings[mempoolReadings.length - 1];
    timeSinceLastStored = latestReading.time - status.time;
  }
  if (timeSinceLastStored >= 1000) {
    mempoolReadings.push({
      time: status.time,
      height: info.blocks,
      txCount: mempool.size,
    });
  }

  // Remove any mempool readings from earlier blocks since we can't compare the txCount
  const readingsThisHeight = mempoolReadings.filter(reading => reading.height === info.blocks);
  mempoolReadings = readingsThisHeight;

  // Need at least two readings to calculate
  if (mempoolReadings.length > 1) {
    const earliestReading = mempoolReadings[0];
    latestReading = mempoolReadings[mempoolReadings.length - 1];
    const elapsedSeconds = (latestReading.time - earliestReading.time) / 1000;
    const transactionCount = latestReading.txCount - earliestReading.txCount;
    status.mempool.txPerSecond = transactionCount / elapsedSeconds;
  } else {
    // Reset until we get at least two readings in same block
    status.mempool.txPerSecond = 0;
  }

  // Only keep 60 mempool readings
  if (mempoolReadings.length > 59) {
    mempoolReadings.shift();
  }

  // // Wait a second before running again
  // setTimeout(main, 1000);

  // Loop back immediately
  main();
}

export function start() {
  main();
}
