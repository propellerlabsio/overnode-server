/* Ignore camel case requirement since many of the variables and arguments    */
/* passed through unmodified from graphql queries where the sources are       */
/* postgresql where camelcase names are not supported.                        */
/* eslint-disable camelcase                                                   */

import { knex } from '../knex';

const addresses = {
  get: async ({ address }) => {
    const outputWithMultiple = knex('output_address')
      .where('address', address)
      .first();

    const outputWithSingle = knex('output')
      .where('address', address)
      .first();

    const [a, b] = await Promise.all([
      outputWithMultiple,
      outputWithSingle,
    ]);

    return a || b;
  },
  findByOutput: ({ transaction_id, output_number }) =>
    knex('output_address')
      .select('address')
      .where('transaction_id', transaction_id)
      .andWhere('output_number', output_number)
      .map(row => row.address),
};

export default addresses;
