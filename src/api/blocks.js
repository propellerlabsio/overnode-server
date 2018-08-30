// TODO remove
/* eslint-disable arrow-body-style, camelcase, no-unused-vars */
import { liveData } from '../main';
import { request } from '../io/rpc';

const blocks = {
  get: async ({ hash, height }) => {
    const block = await request('getblock', (hash || height).toString());
    let lastBlock = { time: 0 };
    if (block.height > 1) {
      lastBlock = await request('getblock', (block.height - 1).toString());
    }
    // const indexField = hash ? 'hash' : 'height';
    // const indexValue = hash || height;
    // const [summary] = await knex('block')
    //   .where(indexField, indexValue);
    // return summary;
    console.log(block);
    return {
      hash: block.hash,
      size: block.size,
      height: block.height,
      time: block.time,
      tx_count: block.tx.length,
      interval: block.time - lastBlock.time,
      tx: block.tx, // Used internally - e.g. transactions.findByBlock()
    };
  },
  find: async ({ paging }) => {
    // // Return query promise
    // const fromHeight = liveData.broadcast.height.overnode.to - paging.offset;
    // return knex('block')
    //   .where('height', '<=', fromHeight)
    //   .orderBy('height', 'desc')
    //   .limit(paging.limit);
    return {};
  },
};

export default blocks;
