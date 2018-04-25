/* Ignore camel case requirement since many of the variables and arguments    */
/* passed through unmodified from graphql queries where the sources are       */
/* postgresql where camelcase names are not supported.                        */
/* eslint-disable camelcase                                                   */

import { knex } from '../io/knex';

const outputs = {
  find: ({ transaction_id, paging }) =>
    knex('output')
      .where('transaction_id', transaction_id)
      .andWhere('output_number', '>=', paging.offset)
      .limit(paging.limit)
      .orderBy('output_number'),
  findByAddress: ({ address, paging }) =>
    knex('output')
      .where('address', address)
      .orderBy('value', 'DESC')
      .offset(paging.offset)
      .limit(paging.limit),
};

export default outputs;
