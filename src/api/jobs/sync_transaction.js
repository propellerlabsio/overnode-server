/* EXCEPTIONS TO ESLINT RULES FOR THIS MODULE:                                */
/* Ignore camel case requirement for function names.  These names are visible */
/* to non-programmers:                                                        */
/* eslint-disable camelcase                                                   */
/*                                                                            */
/* Fetch transactions synchronously.  Async would require that we             */
/* increase the limit that bitcoind will accept by setting option             */
/* rpcworkqueue=<n> to a higher number than the default (16?) but obviously   */
/* there's a ceiling to how far we can keepd doing that.                      */
/* eslint-disable no-await-in-loop                                            */
/*                                                                            */
/* Despite AirBnb's objections, the new for-in syntax is the only way I can   */
/* reliably get async/await working inside a loop and is the recommended way  */
/* to do it according to my searches.  Trying to code around AirBnb's rules   */
/* in this instance has only lead to breaching other rules or buggy code.     */
/* eslint-disable no-restricted-syntax                                        */

import { request as rpc } from '../../rpc';
import { knex } from '../../knex';

// Maximum number of concurrent transactions we will process.  Bitcoin RPC
// by default is configured to allow 16 concurrent calls from all processes
// so we probably want to leave some free.
const MAX_CONCURRENT_TRANSACTIONS = 8;

/**
 * Pop the next txid off the stack and sync it.  Then call this procedure again.
 *
 * @param {*} stack           Stack of transaction ids
 * @param {*} block           Block details
 * @param {*} knexTransaction Knex (not bitcoin) transaction for db consistency
 */
async function syncTransactionFromStack(virtualThreadNo, stack, block, knexTransaction) {
  let promise;

  const txid = stack.pop();
  if (txid) {
    // Get raw transaction
    // console.debug(`Virtual thread ${virtualThreadNo} Getting transaction ${txid}`);
    const rawTx = await rpc('getrawtransaction', txid, 1);

    // Insert transaction into database
    // console.debug(`Virtual thread ${virtualThreadNo} Inserting transaction ${txid}`);
    await knex('transaction').insert({
      id: rawTx.txid,
      size: rawTx.size,
      blockhash: rawTx.blockhash,
      time: rawTx.time,
    }).transacting(knexTransaction);

    // Insert transaction outputs into database.  Note that unlike a regular insert,
    // we are using a db transaction which means we can't get back the id field
    // values of the inserted records
    const outputs = rawTx.vout.map(output => ({
      transaction: rawTx.txid,
      number: output.n,
      value: output.value,
    }));
    await knex.insert(outputs).into('output').transacting(knexTransaction);

    // Insert output addresses into database.  We need to repeat the
    // transaction and output number in this table because we can't
    // get the ids of the inserted records from the above
    const addresses = outputs.reduce((accumulator, output, index) => {
      const rawOutput = rawTx.vout[index];
      const results = accumulator;
      const rawAddresses = rawOutput.scriptPubKey.addresses;
      if (rawAddresses) {
        rawAddresses.forEach((rawAddress) => {
          results.push({
            transaction: output.transaction,
            number: output.number,
            address: rawAddress.substr(12), // ditch 'bitcoincash:' prefix
          });
        });
      }

      return accumulator;
    }, []);
    await knex('output_address').insert(addresses).transacting(knexTransaction);

    // Use recursion to keep processing until stack is exhuasted
    promise = syncTransactionFromStack(virtualThreadNo, stack, block, knexTransaction);
  }

  return promise;
}

/**
 * Populates the database tables 'transaction', 'output' and 'output_address'
 * with details of transactions in the provided block
 *
 * @param {*} block           Full block details provided by bitcoind
 * @param {*} knexTransaction knexTransaction object for db consistency
 */
export default async function sync_transaction(block, knexTransaction) {
  // Can't get transactions for the genesis block
  if (block.height === 0) {
    return;
  }

  // Create stack of txids to be synced
  const stack = block.tx.slice();

  // Create array of concurrent promises
  const promises = [];
  for (let count = 0; count < MAX_CONCURRENT_TRANSACTIONS; count++) {
    const virtualThreadNumber = count + 1;
    promises.push(syncTransactionFromStack(virtualThreadNumber, stack, block, knexTransaction));
  }

  // Resolve all promises
  await Promise.all(promises);
}
