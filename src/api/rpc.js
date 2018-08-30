/**
 * Raw access to bitcoind via JSON-RPC interface.
 *
 * NOTE: bitcoind is configured to limit the number of concurrent
 * requests it will handle.  Beyond that number it will throw an
 * error.
 */

import users from '../api/users';
import { request } from '../io/rpc';

const rpc = {
  async getrawtransaction({ txid, verbose = 0, token }) {
    if (!token) {
      // No token
      throw new Error('Not authorized.');
    }

    // Validate token provided hasn't expired and token gives requester
    // admin rights
    users.validateAccess({ token, permission: 'admin' });


    // Execute request
    return JSON.stringify(await request('getrawtransaction', txid, verbose));
  },

};

export default rpc;
