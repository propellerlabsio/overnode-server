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

import moment from 'moment';
import { request } from '../io/rpc';
import { knex } from '../io/knex';

const maxHelpCacheDays = 7;

const rpc = {
  async execute(command, args) {
    // Execute request
    return JSON.stringify(await request(command, ...Object.values(args)));
  },

  /**
   * Return help for given command
   *
   * Attempts to find help text cached in database but if it doesn't exist then
   * calls bitcoin to get it
   */
  async help({ command }) {
    let help;
    if (command) {
      const cached = await knex('rpc_help')
        .where('command', command)
        .first();
      const now = moment();
      const cachedDaysAgo = now.diff(moment(cached.updated), 'days');
      if (cached && cachedDaysAgo < maxHelpCacheDays) {
        // eslint-disable-next-line prefer-destructuring
        help = cached.help;
      } else {
        help = await rpc.execute('help', { command });

        // Cache answer in database
        if (cached) {
          await knex('rpc_help')
            .where('command', command)
            .update({
              help,
              updated: 'NOW',
            });
        } else {
          await knex('rpc_help')
            .insert({
              command,
              help,
            });
        }
      }
    } else {
      help = await rpc.execute('help', {});
    }
    return help;
  },
};

export default rpc;
