// TODO remove
/* eslint-disable arrow-body-style, camelcase, no-unused-vars */
import { liveData } from '../main';
import { request } from '../io/rpc';

const blocks = {
  get: async ({ hash, height }) => {
    let blockhash;

    // Get hash from bitcoind if we weren't given it.  TODO: Don't do this
    // if node software is BU as their version of 'getblock' can accept height
    if (hash) {
      blockhash = hash;
    } else {
      blockhash = await request('getblockhash', height);
    }
    const block = await request('getblock', blockhash);
    let lastBlock = { time: 0 };
    if (block.height > 1) {
      lastBlock = await request('getblock', block.previousblockhash);
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
    let fromHeight = liveData.broadcast.height.bitcoind - (paging.offset + paging.limit);
    const toHeight = fromHeight + paging.limit;
    if (fromHeight < 0) {
      fromHeight = 0;
    }
    const promises = [];
    for (let i = toHeight; i > fromHeight; --i) {
      promises.push(blocks.get({ height: i }));
    }
    const results = await Promise.all(promises);
    return results;
  },
};

export default blocks;
