// TODO remove
/* eslint-disable arrow-body-style, camelcase, no-unused-vars, max-len */
import transactions from './transactions';

const outputs = {
  get: async ({ transaction_id, output_number }) => {
    const transaction = await transactions.get({ transaction_id });
    return transaction.vout[output_number];
  },
  find: async ({ transaction_id, paging }) => {
    const transaction = await transactions.get({ transaction_id });
    const result = transaction.vout
      .slice(paging.offset, (paging.offset + paging.limit))
      .map((output, index) => {
        const addresses = output.scriptPubKey && output.scriptPubKey.addresses ?
          output.scriptPubKey.addresses :
          ['???']; // TODO investigate what to do with these - possibly pay to script hash
        return {
          transaction_id,
          output_number: index + paging.offset,
          value: output.value,
          address: addresses[0], // TODO follow up why we are returning 2 address properties in schema
          addresses,
        };
      });
    return result;
  },
};

export default outputs;
