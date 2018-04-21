/* Ignore camel case requirement since many of the variables and arguments    */
/* passed through unmodified from graphql queries where the sources are       */
/* postgresql where camelcase names are not supported.                        */
/* eslint-disable camelcase                                                   */

import { knex } from '../knex';

const inputs = {
  find: ({ transaction_id, paging }) =>
    knex('output')
      .column([
        { transaction_id: 'input_transaction_id' },
        'input_number',
        { output_transaction_id: 'transaction_id' },
        'output_number',
        { output_value: 'value' },
      ])
      .where('input_transaction_id', transaction_id)
      .andWhere('input_number', '>=', paging.offset)
      .limit(paging.limit)
      .orderBy('input_number'),
  findByAddress: ({ address, paging }) =>
    knex
      .column([
        { transaction_id: 'input_transaction_id' },
        'input_number',
        { output_transaction_id: 'transaction_id' },
        'output_number',
        { output_value: 'value' },
      ])
      .from('output')
      .whereNotNull('input_transaction_id')
      .andWhere('address', address)
      .offset(paging.offset)
      .orderBy('value', 'DESC')
      .limit(paging.limit)
      .offset(paging.offset),
};

export default inputs;
