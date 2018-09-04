/* Allow console messages from this file only */
/* eslint-disable no-console                  */
import prices from './api/currencies';
import { clientCount } from './io/socket';
import { get as getFullNode } from './io/FullNode';

let mempoolReadings = [];
let lastRpcPeers = [];

// Keep this small as it is broadcast
export const liveData = {
  // Keep following property as small as possible because everything
  // in it will get broadcast every second to all connected clients
  broadcast: {
    time: null,


    // TODO remove
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

export async function updatePrices() {
  try {
    await prices.update();
  } catch (err) {
    console.error(err);
  } finally {
    // Update prices again in 5 minutes
    setTimeout(updatePrices, 1000 * 60 * 5);
  }
}

export async function main() {
  // Get required data from bitcoind
  const fullNode = getFullNode();

  liveData.rpc.info = await fullNode.rpc.getInfo([]);
  liveData.rpc.mempool.bytes = await fullNode.rpc.mempool.getSize();
  liveData.rpc.mempool.size = fullNode.mempool.txIndex.index.size;
  liveData.rpc.peers = await fullNode.rpc.getPeerInfo([]);

  // Set server time for data age
  liveData.broadcast.time = new Date();

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
