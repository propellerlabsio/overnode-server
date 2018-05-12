/* Ignore camel case requirement for function names.  These names are visible */
/* to non-programmers:                                                        */
/* eslint-disable camelcase                                                   */

import { db, upsert } from '../../io/db';
import blocks from '../blocks';

const collection = db.collection('blocks');

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
    if (lastBlock) {
      interval = block.time - lastBlock.time;
    }
  }

  // Upsert block into database
  // There is no upsert in arangoDB javascript api so use update if insert fails
  const blockDocument = {
    _key: block.height.toString(),
    size: block.size,
    hash: block.hash,
    time: block.time,
    interval,
    tx_count: block.tx.length,
  };
  await upsert(collection, blockDocument);
}
