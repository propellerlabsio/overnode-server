// TODO remove
/* eslint-disable arrow-body-style, camelcase, no-unused-vars, max-len */
import transactions from './transactions';

const inputs = {
  find: async ({ transaction_id, paging }) => {
    const transaction = await transactions.get({ transaction_id });
    const result = transaction.vin
      .slice(paging.offset, (paging.offset + paging.limit))
      .map((input, index) => ({
        transaction_id,
        input_number: index + paging.offset,
        coinbase: input.coinbase,
        output_transaction_id: input.txid,
        output_number: input.vout,
        output_value: 9999999999, // TODO output lookup
      }));

    return result;
  },
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
