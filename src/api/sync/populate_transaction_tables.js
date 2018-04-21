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
      transaction_number: transaction.index,
      size: rawTx.size,
      block_height: block.height,
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
      block_height: block.height,
      transaction_number: transaction.index,
    }));
    const insertInputs = knex.insert(inputs).into('input_staging');

    // Build transaction outputs for inserting into database.
    const addresses = []; // For multiple output addresses
    const outputs = rawTx.vout.map((rawOutput) => {
      const address_count = rawOutput.scriptPubKey.addresses ?
        rawOutput.scriptPubKey.addresses.length :
        null;


      // Addresses for outputs with multiple addresses go in output_address table
      if (address_count > 1) {
        rawOutput.scriptPubKey.addresses.forEach(rawAddress => addresses.push({
          transaction_id: rawTx.txid,
          output_number: rawOutput.n,
          address: rawAddress.substr(12), // ditch 'bitcoincash:' prefix
        }));
      }

      // Build output table record.  Store address here if single address (most of them)
      return {
        transaction_id: rawTx.txid,
        output_number: rawOutput.n,
        value: rawOutput.value,
        address: address_count === 1 ?
          rawOutput.scriptPubKey.addresses[0].substr(12) :
          null,
      };
    });

    // Create queries to insert outputs and output addresses
    const insertOutputs = knex.insert(outputs).into('output');
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

  // Now all inputs for this block are in input_staging and we can remove them /
  // convert them to spent outputs.  Can't do earlier due to parallelized processing
  // (outputs spent might be in another thread).  Start with moving coinbase to
  // block header
  await knex('input_staging')
    .where('block_height', block.height)
    .andWhere('transaction_number', 0)
    .andWhere('input_number', 0)
    .first()
    .then(async (input) => {
      await knex('block')
        .where('height', block.height)
        .update('coinbase', input.coinbase);
    })
    .then(async () => {
      await knex('input_staging')
        .where('block_height', block.height)
        .andWhere('transaction_number', 0)
        .andWhere('input_number', 0)
        .delete();
    })
    .catch((err) => {
      throw err;
    });

  // Move inputs from input staging to fields in output table
  // await knex()
  await knex.raw(`
    UPDATE output
    SET input_transaction_id = input_staging.transaction_id,
      input_number = input_staging.input_number
    FROM input_staging
    WHERE input_staging.block_height = ${block.height}
      AND output.transaction_id = input_staging.output_transaction_id
      AND output.output_number = input_staging.output_number;    
  `).then(async () => {
    await knex('input_staging')
      .where('block_height', block.height)
      .delete();
  });
}
