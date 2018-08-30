// TODO remove
/* eslint-disable arrow-body-style, camelcase, no-unused-vars, max-len */

const inputs = {
  find: ({ transaction_id, paging }) => [],
  // knex('output')
  //   .column([
  //     { transaction_id: 'input_transaction_id' },
  //     'input_number',
  //     { output_transaction_id: 'transaction_id' },
  //     'output_number',
  //     { output_value: 'value' },
  //   ])
  //   .where('input_transaction_id', transaction_id)
  //   .andWhere('input_number', '>=', paging.offset)
  //   .limit(paging.limit)
  //   .orderBy('input_number'),
  findByAddress: ({ address, paging }) => [],
  // knex
  //   .column([
  //     { transaction_id: 'input_transaction_id' },
  //     'input_number',
  //     { output_transaction_id: 'transaction_id' },
  //     'output_number',
  //     { output_value: 'value' },
  //   ])
  //   .from('output')
  //   .whereNotNull('input_transaction_id')
  //   .andWhere('address', address)
  //   .offset(paging.offset)
  //   .orderBy('value', 'DESC')
  //   .limit(paging.limit)
  //   .offset(paging.offset),
};

export default inputs;
