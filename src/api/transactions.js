import limits from './limits';
import { knex } from '../knex';

const transactions = {
  get: ({ txid }) => knex('transaction').where('id', txid),
  forBlock: ({ block, fromIndex, limit }) => knex('transaction').where('blockhash', block.hash),

  // get: async ({ txid }) => {
  //   const rawTx = await rpc('getrawtransaction', txid, 1);
  //   return {
  //     txid: rawTx.txid,
  //     size: rawTx.size,
  //     blockhash: rawTx.blockhash,
  //     confirmations: rawTx.confirmations,
  //     time: rawTx.time,
  //     inputs: rawTx.vin.map(input => ({
  //       coinbase: input.coinbase,
  //       txid: input.txid,
  //       output_number: input.vout,
  //     })),
  //     outputs: rawTx.vout.map(output => ({
  //       number: output.n,
  //       addresses: output.scriptPubKey.addresses,
  //       value: output.value,
  //     })),
  //   };
  // },
  // forBlock: async ({ block, fromIndex, limit }) => {
  //   const results = [];
  //   if (block.height === 0) {
  //     // bitcoind rpc method getrawtransaction doesn't work for this block
  //     // TODO: Find alternative
  //   } else {
  //     // Limit rows to be returned
  //     const ourLimit = limit || limits.results.default;
  //     if (ourLimit > limits.results.max) {
  //       throw new Error(`Please limit transactions to no more than ${limits.results.max} results.`);
  //     }

  //     // Get range of tx ids to be returned
  //     const txIds = block.tx.slice(fromIndex, fromIndex + ourLimit);

  //     // Fetch transactions synchronously.  Async would require that we
  //     // increase the limit that bitcoind will accept by setting option rpcworkqueue=<n>
  //     // to a higher number than the default (16?) but obviously there's a ceiling
  //     // to how far we can keepd doing that.
  //     // This data will be moved to database soon(™)
  //     // eslint-disable-next-line no-restricted-syntax
  //     for (const txid of txIds) {
  //       // eslint-disable-next-line no-await-in-loop
  //       const transaction = await transactions.get({ txid });
  //       results.push(transaction);
  //     }
  //   }

  //   return results;
  // },
};

export default transactions;
