// TODO remove
/* eslint-disable arrow-body-style, camelcase, no-unused-vars, max-len */
import { request } from '../io/rpc';

const transactions = {
  get: async ({ transaction_id }) => {
  // knex('transaction')
  //   .where('transaction_id', transaction_id)
  //   .first(),

    debugger;
    const transaction = await request('getrawtransaction', transaction_id, 1);
    const block = await request('getblock', transaction.blockhash);
    debugger;
    
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
  findByBlock: ({ block, paging }) => [],
  // knex('transaction')
  //   .where('block_height', block.height)
  //   .andWhere('transaction_number', '>=', paging.offset)
  //   .limit(paging.limit)
  //   .orderBy('transaction_number'),
};

export default transactions;
