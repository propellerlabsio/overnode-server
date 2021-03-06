/* Ignore camel case requirement since many of the variables and arguments    */
/* passed through unmodified from graphql queries where the sources are       */
/* postgresql where camelcase names are not supported.                        */
/* eslint-disable camelcase                                                   */

import { knex } from '../io/knex';

const transactions = {
  get: ({ transaction_id }) =>
    knex('transaction')
      .where('transaction_id', transaction_id)
      .first(),
  findByBlock: ({ block, paging }) =>
    knex('transaction')
      .where('block_height', block.height)
      .andWhere('transaction_number', '>=', paging.offset)
      .limit(paging.limit)
      .orderBy('transaction_number'),
};

export default transactions;
