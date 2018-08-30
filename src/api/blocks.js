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
    const fromHeight = liveData.broadcast.height.bitcoind - (paging.offset + paging.limit);
    const toHeight = fromHeight + paging.limit;
    const promises = [];
    for (let i = toHeight; i > fromHeight; --i) {
      promises.push(blocks.get({ height: i }));
    }
    const results = await Promise.all(promises);
    return results;
  },
};

export default blocks;
