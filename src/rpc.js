
import http from 'http';

const bitcoinRpcHost = '127.0.0.1'; // TODO move to env var
const bitcoinRpcPort = 8332; // TODO move to env var

export default function request(method, params = []) {

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
      auth: process.env.BITCOIN_RPC_AUTH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json-rpc',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Bitcoin node responded with HTTP code ${res.statusCode}`));
      }
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        responseData = responseData.concat(chunk);
      });
      res.on('end', () => {
        resolve(JSON.parse(responseData).result);
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
