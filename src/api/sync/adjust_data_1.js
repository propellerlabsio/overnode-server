/**
 * Converts block hash to block height in transaction table
 */

/* Ignore camel case requirement for function names.  These names are visible */
/* to non-programmers:                                                        */
/* eslint-disable camelcase                                                   */

import { knex } from '../../knex';

/**
 * Populates the transaction table 'height' field
 *
 * @param {*} block           Full block details provided by bitcoind
 */
export default function adjust_data_1(block) {
  return knex('transaction')
    .where('block_hash', block.hash)
    .update({
      block_height: block.height,
    });
}
