/* Ignore camel case requirement since many of the variables and arguments    */
/* passed through unmodified from graphql queries where the sources are       */
/* postgresql where camelcase names are not supported.                        */
/* eslint-disable camelcase                                                   */

import { knex } from '../knex';

const inputs = {
  find: ({ transaction_id, fromIndex, limit }) =>
    knex('input')
      .where('transaction_id', transaction_id)
      .andWhere('input_index', '>=', fromIndex)
      .limit(limit)
      .orderBy('input_index'),
};

export default inputs;