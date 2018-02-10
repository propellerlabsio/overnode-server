import { request as rpc } from './rpc';
import { knex } from './knex';
import { collate } from './collate';

let mempoolReadings = [];

// Keep this small as it is broadcast
export const status = {
  // Keep following property small -data gets broadcast every second to
  // all connected clients
  stats: {
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
  },
  rpc: {
    info: {},
    mempool: {},
    peers: [],
  },
};

async function main() {
  // Get required data from bitcoind
  status.rpc.info = await rpc('getinfo');
  status.rpc.mempool = await rpc('getmempoolinfo');
  status.rpc.peers = await rpc('getpeerinfo');

  // Set server time for data age
  status.stats.time = new Date();

  // Get number of jobs in error
  const [{ count }] = await knex('job').count('id').whereNotNull('error_message');
  status.stats.jobsInErrorCount = Number(count);

  // Keep core status information in importable variable for other processes
  status.stats.height.bitcoind = status.rpc.info.blocks;
  status.stats.mempool.bytes = status.rpc.mempool.bytes;
  status.stats.mempool.txCount = status.rpc.mempool.size;

  // Collect count of height value for peers
  const peerHeights = [];
  status.rpc.peers.forEach((peer) => {
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
  status.stats.height.peers = commonHeight.height;

  // Get the highest block we have fully synced to the database
  const [{ min }] = await knex('job').min('height').select();
  status.stats.height.overnode = min;

  // If database is behind bitcoind, trigger collate job
  if (status.stats.height.bitcoind > status.stats.height.overnode) {
    const fromHeight = status.stats.height.overnode;
    let toHeight = fromHeight + Number(process.env.COLLATION_JOB_CHUNK_SIZE);
    if (toHeight > status.stats.height.bitcoind) {
      toHeight = status.stats.height.bitcoind;
    }
    await collate(fromHeight, toHeight);
  }

  // Store mempool tx count readings - about 1 a second
  let latestReading;
  let timeSinceLastStored = 0;
  if (mempoolReadings.length) {
    latestReading = mempoolReadings[mempoolReadings.length - 1];
    timeSinceLastStored = status.stats.time - latestReading.time;
  }
  if (!mempoolReadings.length || timeSinceLastStored >= 1000) {
    mempoolReadings.push({
      time: status.stats.time,
      height: status.rpc.info.blocks,
      txCount: status.rpc.mempool.size,
    });
  }

  // Remove any mempool readings from earlier blocks since we can't compare the txCount
  const readingsThisHeight = mempoolReadings
    .filter(reading => reading.height === status.rpc.info.blocks);
  mempoolReadings = readingsThisHeight;

  // Need at least two readings to calculate
  if (mempoolReadings.length > 1) {
    const earliestReading = mempoolReadings[0];
    latestReading = mempoolReadings[mempoolReadings.length - 1];
    const elapsedSeconds = (latestReading.time - earliestReading.time) / 1000;
    const transactionCount = latestReading.txCount - earliestReading.txCount;
    status.stats.mempool.txPerSecond = transactionCount / elapsedSeconds;
  } else {
    // Reset until we get at least two readings in same block
    status.stats.mempool.txPerSecond = 0;
  }

  // Only keep 60 mempool readings
  if (mempoolReadings.length > 59) {
    mempoolReadings.shift();
  }

  // Try to run this loop no more often than once every second or so.  More frequent
  // isn't helpful and maxes out CPU.  Need to allow for logic execution above.
  // Setting to run again in 500ms until we get time to implement more sophisticated
  // logic
  setTimeout(main, 500);
}

export function start() {
  main();
}
