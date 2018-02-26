/* Ignore camel case requirement since many of the variables and arguments    */
/* passed through unmodified from graphql queries where the sources are       */
/* postgresql where camelcase names are not supported.                        */
/* eslint-disable camelcase                                                   */

import { knex } from '../knex';

const transactions = {
  get: ({ transaction_id }) =>
    knex('transaction')
      .where('transaction_id', transaction_id)
      .first(),
  findByAddress: ({ address, fromIndex, limit }) =>
    knex('output_address')
      .select('transaction.*')
      .innerJoin('transaction', 'transaction.transaction_id', 'output_address.transaction_id')
      .where('output_address.address', address)
      .andWhere('transaction.transaction_index', '>=', fromIndex)
      .limit(limit)
      .orderBy('transaction_index'),
  findByBlock: ({ block, fromIndex, limit }) =>
    knex('transaction')
      .where('block_hash', block.hash)
      .andWhere('transaction_index', '>=', fromIndex)
      .limit(limit)
      .orderBy('transaction_index'),
};

export default transactions;
