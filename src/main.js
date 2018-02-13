import axios from 'axios';
import { request as rpc } from './rpc';
import { knex } from './knex';
import { collate } from './collate';

let mempoolReadings = [];
const peerLocationsChecked = [];

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
    // ids only of connected peers
    peerIds: [],
  },
  rpc: {
    info: {},
    mempool: {},
    peers: [],
  },
};

/**
 * Check we have peer geolocation and fetch if not
 *
 * Recursive routine that runs no more than once per second
 * to avoid getting banned from geolocation service
 */
async function checkPeerLocations() {
  try {
    // Get first peer that we don't know if we have a location for it
    const statusUnknown = status.rpc.peers.find(peer => !peerLocationsChecked.includes(peer.addr));
    if (statusUnknown) {
      // Don't check this peer again
      peerLocationsChecked.push(statusUnknown.addr);

      // See if we have location in database
      const [dbResult] = await knex('peer').where('address', statusUnknown.addr);
      if (!dbResult) {
        // No existing record - ask geolocation service for address
        const apiAddress = await axios.get(`http://ip-api.com/json/${statusUnknown.addr.split(':')[0]}`);
        if (apiAddress.status === 200) {
          const { data } = apiAddress;
          await knex('peer').insert({
            address: statusUnknown.addr,
            location_fetched: new Date(),
            country: data.country,
            country_code: data.countryCode,
            region: data.region,
            region_name: data.regionName,
            city: data.city,
            zip: data.zip,
            lat: data.lat,
            lon: data.lon,
            proxy: data.proxy,
            timezone: data.timezone,
            isp: data.isp,
            org: data.org,
            as: data.as,
          });
        }
      }
    }
  } catch (err) {
    console.log('Error checking peer location: ', err.message)
  }

  // Check next peer in a second
  setTimeout(checkPeerLocations, 1000);
}

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

  // Collect ids only of connected peers for broadcasting.  Client can detect
  // changes and request new full peer list
  status.stats.peerIds = status.rpc.peers.map(peer => peer.id);

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
  status.stats.height.peers = commonHeight ? commonHeight.height : 0;

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
  // Main loop
  main();

  // Check peer locations
  checkPeerLocations();
}
