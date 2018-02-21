/* Ignore camel case requirement for function names.  These names are visible */
/* to non-programmers:                                                        */
/* eslint-disable camelcase                                                   */
/* Ignore await in loop - deliberate synchronous job processing.              */
/* eslint-disable no-await-in-loop                                            */

import { request as rpc } from '../../rpc';
import { knex } from '../../knex';

export default async function populate_block_table(job, block) {
  const updatedJob = Object.assign({}, job);
  let interval = 0;
  let lastBlock;
  if (block.height > 0) {
    const lastBlockHeight = block.height - 1;
    lastBlock = await rpc('getblock', lastBlockHeight.toString());
  }
  if (lastBlock) {
    interval = block.time - lastBlock.time;
  }

  await knex('block').insert({
    hash: block.hash,
    size: block.size,
    height: block.height,
    time: block.time,
    interval,
    tx_count: block.tx.length,
  });
  updatedJob.height = block.height;

  return updatedJob;
}
