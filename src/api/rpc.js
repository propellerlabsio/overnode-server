import users from '../api/users';
import { request } from '../io/rpc';

const rpc = {
  /**
   * Execute direct JSON-RPC request on bitcoin client validating
   * an token with admin rights has been provided. Returns result
   * as JSON string.
   *
   * NOTE: bitcoind is configured to limit the number of concurrent
   * requests it will handle.  Beyond that number it will throw an
   * error.  The number of concurrent requests must be shared
   * by blockchain syncing to the overnode database (forward and backward).
   * For this reason (as well as security) this method is restricted
   * to site administrators.
   */
  async request({ command, parameters = [], token }) {
    if (!token) {
      // No token
      throw new Error('Not authorized.');
    }

    // Validate token provided hasn't expired and token gives requester
    // admin rights
    users.validateAccess({ token, permission: 'admin' });


    // Execute request
    return JSON.stringify(await request(command, ...parameters));
  },

};

export default rpc;
