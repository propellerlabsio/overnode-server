/* Ignore camel case requirement since many of the variables and arguments    */
/* passed through unmodified from graphql queries where the sources are       */
/* postgresql where camelcase names are not supported.                        */
/* eslint-disable camelcase                                                   */

import { knex } from '../knex';

const addresses = {
  get: ({ address }) =>
    knex('output_address')
      .where('address', address)
      .first(),
  findByOutput: ({ transaction_id, output_index }) =>
    knex('output_address')
      .select('address')
      .where('transaction_id', transaction_id)
      .andWhere('output_index', output_index)
      .map(row => row.address),
};

export default addresses;
