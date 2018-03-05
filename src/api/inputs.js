/* Ignore camel case requirement since many of the variables and arguments    */
/* passed through unmodified from graphql queries where the sources are       */
/* postgresql where camelcase names are not supported.                        */
/* eslint-disable camelcase                                                   */

import { knex } from '../knex';

const inputs = {
  find: ({ transaction_id, paging }) =>
    knex('input_staging')
      .select('input_staging.*', 'output.value as output_value')
      .where('input_staging.transaction_id', transaction_id)
      .andWhere('input_staging.input_index', '>=', paging.offset)
      .limit(paging.limit)
      .orderBy('input_index')
      .leftJoin('output', {
        'output.transaction_id': 'input_staging.output_transaction_id',
        'output.output_index': 'input_staging.output_index',
      }),
  findByAddress: ({ address, paging }) =>
    knex('output_address')
      .where('output_address.address', address)
      .join('output', {
        'output.transaction_id': 'output_address.transaction_id',
        'output.output_index': 'output_address.output_index',
      })
      .join('input_staging', {
        'output.transaction_id': 'input_staging.output_transaction_id',
        'output.output_index': 'input_staging.output_index',
      })
      .select('input_staging.*', 'output.value as output_value')
      .andWhere('input_staging.input_index', '>=', paging.offset)
      .orderBy('output.value')
      .limit(paging.limit)
      .offset(paging.offset),
};

export default inputs;
