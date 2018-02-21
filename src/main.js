/* Allow console messages from this file only */
/* eslint-disable no-console                  */
import axios from 'axios';
import { request as rpc } from './rpc';
import { knex } from './knex';
import jobs from './api/jobs';
import { clientCount } from './socket';

let mempoolReadings = [];
let lastRpcPeers = [];
const peerLocationsChecked = [];

// Keep this small as it is broadcast
export const liveData = {
  // Keep following property as small as possible because everything
  // in it will get broadcast every second to all connected clients
  broadcast: {
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
    overnode: {
      clientCount: 0,
    },
    // Limited peer information including peer id and new bytesrecv or bytesent
    // figures but only if they have changed. Need to keep broadcast data light
    peers: [],
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
    const statusUnknown = liveData.rpc.peers
      .find(peer => !peerLocationsChecked.includes(peer.addr));
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
    console.log('Error checking peer location: ', err.message);
  }

  // Check next peer in a second
  setTimeout(checkPeerLocations, 1000);
}

async function main() {
  // Get required data from bitcoind
  liveData.rpc.info = await rpc('getinfo');
  liveData.rpc.mempool = await rpc('getmempoolinfo');
  liveData.rpc.peers = await rpc('getpeerinfo');

  // Set server time for data age
  liveData.broadcast.time = new Date();

  // Get number of jobs in error
  const [{ count }] = await knex('job').count('function_name').whereNotNull('error_message');
  liveData.broadcast.jobsInErrorCount = Number(count);

  // Keep core status information in importable variable for other processes
  liveData.broadcast.height.bitcoind = liveData.rpc.info.blocks;
  liveData.broadcast.mempool.bytes = liveData.rpc.mempool.bytes;
  liveData.broadcast.mempool.txCount = liveData.rpc.mempool.size;

  // Collect connected peers data for broadcasting.  Client can detect
  // changes and request new full peer list or single peer via graphql
  // where appropriate so keep this data limited for performance.
  liveData.broadcast.peers = liveData.rpc.peers.map((peer) => {
    const broadcastPeer = {
      id: peer.id,
    };

    // Lookup old peer data
    const oldPeer = lastRpcPeers.find(old => old.id === peer.id);
    if (oldPeer) {
      // Broadcast bytesrecv but only if it has changed
      if (oldPeer.bytesrecv !== peer.bytesrecv) {
        broadcastPeer.bytesrecv = peer.bytesrecv;
      }

      // Broadcast bytessent but only if it has changed
      if (oldPeer.bytessent !== peer.bytessent) {
        broadcastPeer.bytessent = peer.bytessent;
      }
    }

    return broadcastPeer;
  });

  // Get the highest block we have fully synced to the database
  const [{ min }] = await knex('job').min('height').select();
  liveData.broadcast.height.overnode = min;

  // Collect count of block height value for peers
  // Ingore those where peer does not provide a valid value - ie -1
  const peerHeights = [];
  liveData.rpc.peers
    .filter(peer => peer.synced_blocks > -1)
    .forEach((peer) => {
      const index = peerHeights
        .findIndex(rec => rec.height === peer.synced_blocks);
      if (index < 0) {
        peerHeights.push({ height: peer.synced_blocks, count: 1 });
      } else {
        peerHeights[index].count++;
      }
    });

  // Get most common peer height at or above our height
  const [commonHeight] = peerHeights.sort((a, b) => a.count < b.count);
  liveData.broadcast.height.peers = commonHeight ? commonHeight.height : 0;

  // If database is behind bitcoind, trigger collate jobs unless we
  // are in an error state.
  if (!liveData.broadcast.jobsInErrorCount) {
    if (liveData.broadcast.height.bitcoind > liveData.broadcast.height.overnode) {
      const fromHeight = liveData.broadcast.height.overnode + 1;
      let toHeight = fromHeight + Number(process.env.COLLATION_JOB_CHUNK_SIZE) - 1;
      if (toHeight > liveData.broadcast.height.bitcoind) {
        toHeight = liveData.broadcast.height.bitcoind;
      }
      await jobs.process({ fromHeight, toHeight });
    }
  }

  // Store mempool tx count readings - about 1 a second
  let latestReading;
  let timeSinceLastStored = 0;
  if (mempoolReadings.length) {
    latestReading = mempoolReadings[mempoolReadings.length - 1];
    timeSinceLastStored = liveData.broadcast.time - latestReading.time;
  }
  if (!mempoolReadings.length || timeSinceLastStored >= 1000) {
    mempoolReadings.push({
      time: liveData.broadcast.time,
      height: liveData.rpc.info.blocks,
      txCount: liveData.rpc.mempool.size,
    });
  }

  // Remove any mempool readings from earlier blocks since we can't compare the txCount
  const readingsThisHeight = mempoolReadings
    .filter(reading => reading.height === liveData.rpc.info.blocks);
  mempoolReadings = readingsThisHeight;

  // Need at least two readings to calculate
  if (mempoolReadings.length > 1) {
    const earliestReading = mempoolReadings[0];
    latestReading = mempoolReadings[mempoolReadings.length - 1];
    const elapsedSeconds = (latestReading.time - earliestReading.time) / 1000;
    const transactionCount = latestReading.txCount - earliestReading.txCount;
    liveData.broadcast.mempool.txPerSecond = transactionCount / elapsedSeconds;
  } else {
    // Reset until we get at least two readings in same block
    liveData.broadcast.mempool.txPerSecond = 0;
  }

  // Only keep 60 mempool readings
  if (mempoolReadings.length > 59) {
    mempoolReadings.shift();
  }

  // Remember current peers data so next loop we can compare
  lastRpcPeers = liveData.rpc.peers.slice();

  // Update number of overnode clients currently connected
  liveData.broadcast.overnode.clients = clientCount();

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
