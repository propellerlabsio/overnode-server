
import http from 'http';

const bitcoinRpcHost = '127.0.0.1'; // TODO move to env var
const bitcoinRpcPort = 8332; // TODO move to env var

export default function request(query) {
  // return new pending promise
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(query);
    const responseData = '';

    const options = {
      hostname: bitcoinRpcHost,
      port: bitcoinRpcPort,
      // path: '/upload',
      // auth: 'REPLACED:REPLACED', // TODO move to env var
      auth: '__cookie__:hRyLxvy9C4lQodzG/st0G3+Sa/otiUDGvncWkdVzRGg=', // TODO move to env var
      method: 'POST',
      headers: {
        'Content-Type': 'application/json-rpc',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      // Expecting http 400
      if (res.statusCode !== '400') {
        reject(new Error(`Server responded with HTTP code ${res.statusCode}`));
        // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      }
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        responseData.concat(chunk);
      });
      res.on('end', () => {
        resolve(responseData);
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
