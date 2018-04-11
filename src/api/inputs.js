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
      .andWhere('input_staging.input_number', '>=', paging.offset)
      .limit(paging.limit)
      .orderBy('input_number')
      .leftJoin('output', {
        'output.transaction_id': 'input_staging.output_transaction_id',
        'output.output_number': 'input_staging.output_number',
      }),
  findByAddress: ({ address, paging }) => 
    knex
      .select('input_staging.*', 'output.value as output_value')
      .from('output')
      .leftJoin('output_address', {
        'output.transaction_id': 'output_address.transaction_id',
        'output.output_number': 'output_address.output_number',
      })
      .join('input_staging', {
        'output.transaction_id': 'input_staging.output_transaction_id',
        'output.output_number': 'input_staging.output_number',
      })
      .where('output.address', address)
      .orWhere('output_address.address', address)
      .offset(paging.offset)
      .orderBy('output.value', 'DESC')
      .limit(paging.limit)
      .offset(paging.offset),
};

export default inputs;
