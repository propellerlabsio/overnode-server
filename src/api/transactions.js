import { knex } from '../knex';

const transactions = {
  get: ({ txid }) => knex('transaction').where('id', txid),
  forBlock: ({ block, fromIndex, limit }) =>
    knex('transaction')
      .where('block_hash', block.hash)
      .andWhere('transaction_index', '>=', fromIndex)
      .limit(limit)
      .orderBy('transaction_index'),
};

export default transactions;
