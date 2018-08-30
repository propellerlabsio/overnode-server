// TODO remove
/* eslint-disable arrow-body-style, camelcase, no-unused-vars, max-len */
import transactions from './transactions';

const outputs = {
  find: async ({ transaction_id, paging }) => {
    const transaction = await transactions.get({ transaction_id });
    const result = transaction.vout
      .slice(paging.offset, (paging.offset + paging.limit))
      .map((output, index) => ({
        transaction_id,
        output_number: index + paging.offset,
        value: output.value,
        address: output.scriptPubKey ? output.scriptPubKey.addresses[0] : '',
        addresses: output.scriptPubKey ? output.scriptPubKey.addresses : [],
      }));
    return result;
  },
  findByAddress: ({ address, paging }) => [],
  // knex('output')
  //   .where('address', address)
  //   .orderBy('value', 'DESC')
  //   .offset(paging.offset)
  //   .limit(paging.limit),
};

export default outputs;
