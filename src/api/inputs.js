// TODO remove
/* eslint-disable arrow-body-style, camelcase, no-unused-vars, max-len */
import transactions from './transactions';
import outputs from './outputs';

const inputs = {
  find: async ({ transaction_id, paging }) => {
    const transaction = await transactions.get({ transaction_id });
    const results = transaction.vin
      .slice(paging.offset, (paging.offset + paging.limit))
      .map((input, index) => ({
        transaction_id,
        input_number: index + paging.offset,
        coinbase: input.coinbase,
        output_transaction_id: input.txid,
        output_number: input.vout,
      }));

    // Build promises to update UTXO value in our results
    const promises = results.map((result, index) => {
      const output_value = result.coinbase
        ? transaction.vout
          .reduce((previous, current) => {
            return current.value + previous.value;
          }, { value: 0 })
        : outputs
          .get({ transaction_id: result.transaction_id, output_number: result.output_number })
          .then(output => output.value);
      return Object.assign(result, { output_value });
    });

    return Promise.all(promises);
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
