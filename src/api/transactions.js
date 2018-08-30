// TODO remove
/* eslint-disable arrow-body-style, camelcase, no-unused-vars, max-len */
import { request } from '../io/rpc';

const transactions = {
  get: async ({ transaction_id }) => {
    const transaction = await request('getrawtransaction', transaction_id, 1);
    const block = await request('getblock', transaction.blockhash);

    return {
      transaction_id: transaction.txid,
      transaction_number: block.tx.indexOf(transaction_id),
      size: transaction.size,
      block_height: block.height,
      time: transaction.time,
      input_count: transaction.vin.length,
      output_count: transaction.vout.length,
    };
  },
  findByBlock: ({ block, paging }) => {
    const promises = block.tx
      .slice(paging.offset, (paging.offset + paging.limit))
      .map(txId => transactions.get({ transaction_id: txId }));
    return Promise.all(promises);
  },

  // knex('transaction')
  //   .where('block_height', block.height)
  //   .andWhere('transaction_number', '>=', paging.offset)
  //   .limit(paging.limit)
  //   .orderBy('transaction_number'),
};

export default transactions;
