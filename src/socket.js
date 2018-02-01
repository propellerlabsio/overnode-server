/* Allow console messages in this file: */
/*   eslint-disable no-console          */

import http from 'http';
import WebSocket from 'ws';
import rpc from './rpc';

const CONNECTION_OPEN = 1;
let wss; // Websocket servr
let txPerSecond = 0;
let mempoolReadings = [];

export function start(app) {
  const server = http.createServer(app);
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      console.log('received: %s', message);
    });

    ws.on('error', (err) => {
      if (err.code && err.code === 'ECONNRESET') {
        // Chrome bug from version 61 - user clicked browser refresh.
        // Safe to ignore per:
        // https://github.com/websockets/ws/issues/1269
        // https://bugs.chromium.org/p/chromium/issues/detail?id=798194#c3
      } else {
        console.log('Socket error:', err);
      }
    });
  });

  server.listen(4010, () => {
    console.log('Socket server listening on %d', server.address().port);
  });
}

export async function broadcast() {
  try {
    // Get required data from bitcoind
    const info = await rpc('getinfo');
    const mempool = await rpc('getmempoolinfo');
    const now = new Date();

    // Store mempool tx count readings
    mempoolReadings.push({
      time: now,
      height: info.blocks,
      txCount: mempool.size,
    });

    // Remove any mempool readings from earlier blocks since we can't compare the txCount
    const readingsThisHeight = mempoolReadings.filter(reading => reading.height === info.blocks);
    mempoolReadings = readingsThisHeight;

    // Need at least two readings to calculate
    if (mempoolReadings.length > 1) {
      const earliestReading = mempoolReadings[0];
      const latestReading = mempoolReadings[mempoolReadings.length - 1];
      const elapsedSeconds = (latestReading.time - earliestReading.time) / 1000;
      const transactionCount = latestReading.txCount - earliestReading.txCount;
      txPerSecond = transactionCount / elapsedSeconds;
    } else {
      // Reset until we get at least two readings in same block
      txPerSecond = 0;
    }
    
    // Only keep 60 mempool readings
    if (mempoolReadings.length > 59) {
      mempoolReadings.shift();
    }

    // Structure broadcast data
    const outData = {
      mempool: {
        time: now,
        txCount: mempool.size,
        txPerSecond,
        bytes: mempool.bytes,
      },
    };

    wss.clients.forEach((client) => {
      if (client.readyState === CONNECTION_OPEN) {
        client.send(JSON.stringify(outData));
      }
    });
  } catch (err) {
    console.log('Broadcast error: ', err);
  }

  // Wait a second before broadcasting again
  setTimeout(broadcast, 1000);
}
