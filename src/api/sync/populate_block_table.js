/* Ignore camel case requirement for function names.  These names are visible */
/* to non-programmers:                                                        */
/* eslint-disable camelcase                                                   */

import blocks from '../blocks';
import { knex } from '../../knex';

/**
 * Populates the database table 'block' with details of the provided block
 *
 * @param {*} block           Full block details provided by bitcoind
 */
export default async function populate_block_table(block) {
  // Determine value of calculated field: time interval between this block and the last
  let interval = 0;
  if (block.height > 0) {
    const lastBlockHeight = block.height - 1;
    const lastBlock = await blocks.get({ height: lastBlockHeight });
    if (!lastBlock) {
      throw new Error(`Can't find previous block ${lastBlockHeight} in database`);
    }
    interval = block.time - lastBlock.time;
  }

  // Insert block into database using provided transaction
  await knex('block').insert({
    hash: block.hash,
    size: block.size,
    height: block.height,
    time: block.time,
    interval,
    tx_count: block.tx.length,
  });
}
