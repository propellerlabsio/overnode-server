/* EXCEPTIONS TO ESLINT RULES FOR THIS MODULE:                                */
/* Ignore camel case requirement for function names.  These names are visible */
/* to non-programmers:                                                        */
/* eslint-disable camelcase                                                   */

import { request as rpc } from '../../rpc';
import { knex } from '../../knex';

// Maximum number of concurrent transactions we will process.  Bitcoin RPC
// by default is configured to allow 16 concurrent calls from all processes
// so we need to leave enough free for whatever other processes are hitting
// bitcoind.
const MAX_CONCURRENT_TRANSACTIONS = 2;

/**
 * Pop the next txid off the stack and sync it.  Then call this procedure again.
 *
 * @param {*} stack           Stack of transaction ids
 * @param {*} block           Block details
 * @param {*} knexTransaction Knex (not bitcoin) transaction for db consistency
 */
async function syncTransactionFromStack(virtualThreadNo, stack, block, knexTransaction) {
  let promise;

  const transaction = stack.pop();
  if (transaction) {
    // Get raw transaction
    // console.debug(`Virtual thread ${virtualThreadNo} Getting transaction ${txid}`);
    const rawTx = await rpc('getrawtransaction', transaction.transaction_id, 1);

    // Insert transaction into database
    // console.debug(`Virtual thread ${virtualThreadNo} Inserting transaction ${txid}`);
    await knex('transaction').insert({
      transaction_id: rawTx.txid,
      transaction_index: transaction.index,
      size: rawTx.size,
      block_hash: rawTx.blockhash,
      time: rawTx.time,
      input_count: rawTx.vin.length,
      output_count: rawTx.vout.length,
    }).transacting(knexTransaction);

    // Insert transaction inputs into database.
    const inputs = rawTx.vin.map((input, index) => ({
      transaction_id: rawTx.txid,
      input_index: index,
      block_hash: block.hash,
      coinbase: input.coinbase,
      output_transaction_id: input.txid,
      output_index: input.vout,
    }));
    await knex.insert(inputs).into('input').transacting(knexTransaction);

    // Insert transaction outputs into database.  Note that unlike a regular insert,
    // we are using a db transaction which means we can't get back the id field
    // values of the inserted records
    const outputs = rawTx.vout.map(output => ({
      transaction_id: rawTx.txid,
      output_index: output.n,
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
            transaction_id: output.transaction_id,
            output_index: output.output_index,
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
export default async function populate_transaction_tables(block, knexTransaction) {
  // Can't get transactions for the genesis block
  if (block.height === 0) {
    return;
  }

  // Create stack of txids to be synced
  const stack = block.tx.slice().map((transaction_id, index) => ({
    index,
    transaction_id,
  }));

  // Create array of concurrent promises
  const promises = [];
  for (let count = 0; count < MAX_CONCURRENT_TRANSACTIONS; count++) {
    const virtualThreadNumber = count + 1;
    promises.push(syncTransactionFromStack(virtualThreadNumber, stack, block, knexTransaction));
  }

  // Resolve all promises
  await Promise.all(promises);
}
