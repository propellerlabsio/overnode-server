// TODO remove
/* eslint-disable arrow-body-style, camelcase, no-unused-vars, max-len */

const outputs = {
  find: ({ transaction_id, paging }) => [],
  // knex('output')
  //   .where('transaction_id', transaction_id)
  //   .andWhere('output_number', '>=', paging.offset)
  //   .limit(paging.limit)
  //   .orderBy('output_number'),
  findByAddress: ({ address, paging }) => [],
  // knex('output')
  //   .where('address', address)
  //   .orderBy('value', 'DESC')
  //   .offset(paging.offset)
  //   .limit(paging.limit),
};

export default outputs;
