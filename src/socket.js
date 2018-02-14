/* Allow console messages in this file: */
/*   eslint-disable no-console          */
import WebSocket from 'ws';
import { liveData } from './main';

const CONNECTION_OPEN = 1;
let wss; // Websocket servr

export async function broadcast() {
  try {
    const outData = JSON.stringify({
      liveData: liveData.broadcast,
    });
    wss.clients.forEach((client) => {
      if (client.readyState === CONNECTION_OPEN) {
        client.send(outData);
      }
    });
  } catch (err) {
    console.error('WebSocket broadcast error: ', err);
  }

  // Wait a second before broadcasting again
  setTimeout(broadcast, 1000);
}

export default function start(server) {
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

  // Start broadcasting
  broadcast();
}
