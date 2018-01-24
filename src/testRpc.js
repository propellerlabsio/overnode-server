/* Allow console messages from this file only */
/* eslint-disable no-console                  */
import request from './request';

const getinfo = {
  jsonrpc: '1.0',
  id: 'curltest',
  method: 'getinfo',
  params: [],
};

async function main() {
  const result = await request(getinfo);
  console.log(result);
}

main();
