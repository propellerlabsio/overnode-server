/* Ignore camel case requirement since many of the variables and arguments    */
/* passed through unmodified from graphql queries where the sources are       */
/* postgresql where camelcase names are not supported.                        */
/* eslint-disable camelcase                                                   */

import { knex } from '../knex';

const outputs = {
  find: ({ transaction_id, fromIndex, limit }) =>
    knex('output')
      .where('transaction_id', transaction_id)
      .andWhere('output_index', '>=', fromIndex)
      .limit(limit)
      .orderBy('output_index'),
};

export default outputs;
