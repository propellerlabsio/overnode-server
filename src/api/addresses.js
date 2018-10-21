/* Ignore camel case requirement since many of the variables and arguments    */
/* passed through unmodified from graphql queries where the sources are       */
/* postgresql where camelcase names are not supported.                        */
/* eslint-disable camelcase                                                   */

import { knex } from '../io/knex';

const addresses = {
  // Dummy node needed for child nodes, just return address
  get: async ({ address }) => ({ address }),

  getTotals: async ({ address }) => {
    const totalReceivedQuery =
      knex('address_received')
        .sum('value as received')
        .from('address_received')
        .where('address', address)
        .first();
    const totalSpentQuery =
      knex('address_spent')
        .sum('value as spent')
        .from('address_spent')
        .andWhere('address', address)
        .first();
    const [{ received }, { spent }] = await Promise.all([
      totalReceivedQuery,
      totalSpentQuery,
    ]);

    return {
      received: received || 0,
      spent: spent || 0,
    };
  },
  findReceived: ({ address }) =>
    knex('address_received')
      .where('address', address),
  findSpent: ({ address }) =>
    knex('address_spent')
      .where('address', address),
  findByOutput: ({ transaction_id, output_number }) =>
    knex('address_received')
      .select('address')
      .where('transaction_id', transaction_id)
      .andWhere('output_number', output_number)
      .map(row => row.address),
};

export default addresses;
