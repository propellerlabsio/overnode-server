// TODO remove
/* eslint-disable arrow-body-style, camelcase, no-unused-vars */
import { liveData } from '../main';
import { request } from '../io/rpc';
import { get as getFullNode } from '../io/FullNode';


const blocks = {
  get: async ({ hash, height }) => {
    if (!height) {
      throw new Error('TODO - get by hash not reimplemented yet');
    }
    const fullNode = getFullNode();
    const block = await fullNode.getBlock(height);
    const blockDetails = block.getJSON();
    // Remediate Bcoin bug: height not returned in JSON
    blockDetails.height = height || block.getCoinbaseHeight();
    let lastBlockDetails = { time: 0 };
    if (blockDetails.height > 0) {
      lastBlockDetails = (await fullNode.getBlock(blockDetails.height - 1)).getJSON();
    }
    return {
      hash: blockDetails.hash,
      size: block.getSize(),
      height: blockDetails.height,
      time: blockDetails.time,
      tx_count: blockDetails.txs.length,
      interval: blockDetails.time - lastBlockDetails.time,
      tx: blockDetails.txs, // Used internally - e.g. transactions.findByBlock()
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
