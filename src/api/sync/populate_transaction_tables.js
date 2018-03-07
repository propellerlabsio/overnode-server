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
const MAX_CONCURRENT_TRANSACTIONS = 6;

/**
 * Pop the next txid off the stack and sync it.  Then call this procedure again.
 *
 * @param {*} stack           Stack of transaction ids
 * @param {*} block           Block details
 */
async function syncTransactionFromStack(virtualThreadNo, stack, block) {
  let promise;

  const transaction = stack.pop();
  if (transaction) {
    // Get raw transaction
    // console.debug(`Virtual thread ${virtualThreadNo} Getting transaction ${txid}`);
    const rawTx = await rpc('getrawtransaction', transaction.transaction_id, 1);

    // Insert transaction into database
    // console.debug(`Virtual thread ${virtualThreadNo} Inserting transaction ${txid}`);
    const insertTransactions = knex('transaction').insert({
      transaction_id: rawTx.txid,
      transaction_index: transaction.index,
      size: rawTx.size,
      block_hash: rawTx.blockhash,
      time: rawTx.time,
      input_count: rawTx.vin.length,
      output_count: rawTx.vout.length,
    });

    // Insert transaction inputs into database.
    const inputs = rawTx.vin.map((input, index) => ({
      transaction_id: rawTx.txid,
      input_number: index,
      coinbase: input.coinbase,
      output_transaction_id: input.txid,
      output_number: input.vout,
    }));
    const insertInputs = knex.insert(inputs).into('input_staging');

    // Insert transaction outputs into database.  Note that unlike a regular insert,
    // we are using a db transaction which means we can't get back the id field
    // values of the inserted records
    const outputs = rawTx.vout.map(output => ({
      transaction_id: rawTx.txid,
      output_number: output.n,
      value: output.value,
    }));
    const insertOutputs = knex.insert(outputs).into('output');

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
            output_number: output.output_number,
            address: rawAddress.substr(12), // ditch 'bitcoincash:' prefix
          });
        });
      }

      return accumulator;
    }, []);
    const insertAddresses = knex('output_address').insert(addresses);

    // Do inserts in parallel
    await Promise.all([
      insertTransactions,
      insertInputs,
      insertOutputs,
      insertAddresses,
    ]);

    // Use recursion to keep processing until stack is exhuasted
    promise = syncTransactionFromStack(virtualThreadNo, stack, block);
  }

  return promise;
}

/**
 * Populates the database tables 'transaction', 'output' and 'output_address'
 * with details of transactions in the provided block
 *
 * @param {*} block           Full block details provided by bitcoind
 */
export default async function populate_transaction_tables(block) {
  // Can't get transactions for the genesis block
  if (block.height === 0) {
    return;
  }

  // Create stack of txids to be synced
  const stack = block.tx.slice().map((transaction_id, index) => ({
    index,
    transaction_id,
  }));

  // Split stack into separate arrays for each thread.  Not sure if necessary
  // but there's a sporadic production bug that I can only put down to
  // a problem with the virtual threads all popping the next transaction
  // off of the same array
  const transactionsPerVirtualThread = Math.ceil(stack.length / MAX_CONCURRENT_TRANSACTIONS);

  // Create array of concurrent promises
  const promises = [];
  for (let count = 0; count < MAX_CONCURRENT_TRANSACTIONS; count++) {
    const virtualThreadNumber = count + 1;
    const stackFromIndex = count * transactionsPerVirtualThread;
    const stackToIndex = stackFromIndex + transactionsPerVirtualThread;
    const stackPortion = stack.slice(stackFromIndex, stackToIndex);
    promises.push(syncTransactionFromStack(
      virtualThreadNumber,
      stackPortion,
      block,
    ));
  }

  // Resolve all promises
  await Promise.all(promises);
}
