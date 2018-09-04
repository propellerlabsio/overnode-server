
import http from 'http';
import fs from 'fs';
import path from 'path';

const bitcoinRpcHost = process.env.BITCOIN_RPC_HOST || '127.0.0.1';
const bitcoinRpcPort = process.env.BITCOIN_RPC_PORT || 8332;

let auth;

export function request(method, ...params) {
  let responseData = '';

  // return new pending promise
  return new Promise((resolve, reject) => {
    const rpcRequest = {
      jsonrpc: '1.0',
      id: `node-manager${(new Date()).toISOString()}`,
      method,
      params,
    };
    const postData = JSON.stringify(rpcRequest);

    const options = {
      hostname: bitcoinRpcHost,
      port: bitcoinRpcPort,
      auth,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json-rpc',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        responseData = responseData.concat(chunk);
      });
      res.on('end', () => {
        if (responseData) {
          try {
            // Probably JSON response
            const jsonResponse = JSON.parse(responseData);
            if (jsonResponse.error) {
              reject(new Error(`bitcoind error: ${JSON.stringify(jsonResponse.error)}`));
            } else {
              resolve(jsonResponse.result);
            }
          } catch (err) {
            // Not a JSON response - probably just an error message in plaintext
            reject(new Error(`bitcoind returned: ${responseData}`));
          }
        } else if (res.statusCode !== 200) {
          reject(new Error(`Bitcoin node responded with HTTP code ${res.statusCode}: ${res.statusMessage}`));
        } else {
          resolve();
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`problem with request: ${e.message}`));
    });

    // write data to request body
    req.write(postData);
    req.end();
  });
}

export async function initialize() {
  try {
    auth = process.env.BITCOIN_RPC_AUTH;

    // Test credentials
    await request('getinfo');
  } catch (err) {
    if (err.message.includes('ECONNREFUSED')) {
      throw new Error(`Unable to connect to bitcoind at ${bitcoinRpcHost}:${bitcoinRpcPort} (possibly not running): ECONNREFUSED`);
    } else if (err.message.includes('401')) {
      throw new Error('Unable to connect to bitcoind (possibly incorrect RPC credentials): server returned 401.');
    } else {
      throw err;
    }
  }
}
