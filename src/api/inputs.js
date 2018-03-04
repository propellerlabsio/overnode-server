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
};

export default inputs;
