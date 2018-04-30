/**
 * Raw access to bitcoind via JSON-RPC interface.
 *
 * NOTE: bitcoind is configured to limit the number of concurrent
 * requests it will handle.  Beyond that number it will throw an
 * error.  The number of concurrent requests must be shared
 * by blockchain syncing to the overnode database (forward and backward).
 * For this reason (as well as security) these methods are restricted
 * to site administrators.
 */

import { request } from '../io/rpc';

const rpc = {
  async getinfo() {
    // Execute request
    return JSON.stringify(await request('getinfo'));
  },
  async getrawtransaction({ txid, verbose = 0 }) {
    // Execute request
    return JSON.stringify(await request('getrawtransaction', txid, verbose));
  },

};

export default rpc;
