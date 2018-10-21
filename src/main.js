/* Allow console messages from this file only */
/* eslint-disable no-console                  */
import axios from 'axios';
import { request as rpc } from './io/rpc';
import { knex } from './io/knex';
import sync from './api/sync';
import prices from './api/currencies';
import { clientCount } from './io/socket';

let mempoolReadings = [];
let lastRpcPeers = [];
const peerLocationsChecked = [];

// Keep this small as it is broadcast
export const liveData = {
  // Keep following property as small as possible because everything
  // in it will get broadcast every second to all connected clients
  broadcast: {
    time: null,
    syncInErrorCount: 0,

    // Server is prioritzing long-running sync jobs; live data will not change until finished
    prioritySyncing: false,

    height: {
      bitcoind: null,
      overnode: {
        from: null,
        to: null,
      },
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

async function updatePrices() {
  try {
    await prices.update();
  } catch (err) {
    console.error(err);
  } finally {
    // Update prices again in 5 minutes
    setTimeout(updatePrices, 1000 * 60 * 5);
  }
}

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

      // Ignore ipv6(?)/local(?) addresses
      if (!statusUnknown.addr.includes('[')) {
        // See if we have peer in database
        const [ipAddress, port] = statusUnknown.addr.split(':');
        const knownPeer = await knex('peer').where('ip_address', ipAddress).andWhere('port', port).first();
        if (!knownPeer) {
          await knex('peer').insert({
            ip_address: ipAddress,
            port,
          });
        }

        // See if we have location in database
        const knownLocation = await knex('geolocation').where('ip_address', ipAddress).first();
        if (!knownLocation) {
          // No existing record - ask geolocation service for address
          const apiAddress = await axios.get(`http://ip-api.com/json/${ipAddress}`);
          if (apiAddress.status === 200) {
            const { data } = apiAddress;
            await knex('geolocation').insert({
              ip_address: ipAddress,
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

  // Get number of sync blocks in error
  const [{ count }] = await knex('sync_error').count('name');
  liveData.broadcast.syncInErrorCount = Number(count);

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

  // Collect count of block height value for peers
  // Ingore those where peers who are behind our bitcoind best block
  const peerHeights = [];
  liveData.rpc.peers
    .filter(peer => peer.synced_headers >= liveData.broadcast.height.bitcoind)
    .forEach((peer) => {
      const index = peerHeights
        .findIndex(rec => rec.height === peer.synced_headers);
      if (index < 0) {
        peerHeights.push({ height: peer.synced_blocks, count: 1 });
      } else {
        peerHeights[index].count++;
      }
    });

  // Get most common peer height at or above our height
  const [commonHeight] = peerHeights.sort((a, b) => b.count - a.count);
  liveData.broadcast.height.peers = commonHeight ? commonHeight.height : 0;

  // Get the lowest and highest block we have fully synced to the database
  const [{ from }, { to }] = await sync.getCoverage();
  liveData.broadcast.height.overnode.from = from;
  liveData.broadcast.height.overnode.to = to;

  // If database is behind bitcoind, trigger sync jobs
  if (liveData.broadcast.height.bitcoind > liveData.broadcast.height.overnode.to) {
    // If we are very far behind, go into "prioritySyncing" mode where we continually
    // process blocks until we are caught up and all other services will be degraded.
    const behindBy = liveData.broadcast.height.bitcoind - liveData.broadcast.height.overnode.to;
    if (behindBy > 6 && process.env.NO_PRIORITY_SYNCING !== 'yes') {
      console.log(`Database is ${behindBy} blocks behind. Entering prioritySyncing mode; other services will be suspended/degraded.`);

      // Signal clients that we are in priortySyncing mode
      liveData.broadcast.prioritySyncing = true;

      // Process all blocks that we haven't yet synced (forward direction only)
      const fromHeight = liveData.broadcast.height.overnode.to + 1;
      const toHeight = liveData.broadcast.height.bitcoind;
      await sync.process({ fromHeight, toHeight, direction: sync.FORWARD });

      // Signal to clients that prioritySyncing has finished
      liveData.broadcast.prioritySyncing = false;
      console.log('Leaving prioritySyncing mode.');
    } else {
      // Regular processing, only one block at a time
      const fromHeight = liveData.broadcast.height.overnode.to + 1;
      const toHeight = fromHeight;
      await sync.process({ fromHeight, toHeight, direction: sync.FORWARD });
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

  // Check peer locations periodically
  checkPeerLocations();

  // Update prices periodically
  updatePrices();
}
