/* Allow console messages in this file: */
/*   eslint-disable no-console          */

import http from 'http';
import WebSocket from 'ws';

import rpc from './rpc';
// import { knex } from './knex';


const CONNECTION_OPEN = 1;
let wss;

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

    ws.send('something');
  });

  server.listen(4010, () => {
    console.log('Socket server listening on %d', server.address().port);
  });
}

export async function broadcast() {
  try {
    const mempool = await rpc('getmempoolinfo');
    const outData = {
      mempool_tx_count: mempool.size,
      mempool_size_bytes: mempool.bytes,
    };

    wss.clients.forEach((client) => {
      if (client.readyState === CONNECTION_OPEN) {
        client.send(JSON.stringify(outData));
      }
    });
  } catch (err) {
    console.log('Broadcast error: ', err);
  }

  // Delay 500ms to allow other stuff to run if we are on a single core machine
  // Don't know how long the above functionality takes to run but hopefully
  // under 500ms so we end up with new data broadcast once per second or less.
  // TODO - make this more robust. In case the above code is very fast we
  // probably don't get any benefit from sub 1 second rebroadasting and hitting
  // bitcoind more frequently might not be good.
  setTimeout(broadcast, 500);
}
