import { request as rpc } from '../../io/rpc';

// Maximum number of concurrent transactions we will process.  Bitcoin RPC
// by default is configured to allow 16 concurrent calls from all processes
// so we need to leave enough free for whatever other processes are hitting
// bitcoind.
const MAX_CONCURRENT_TRANSACTIONS = 6;

/**
 * Sync the given transaction to the database.  Then call this procedure again.
 *
 * @param {*} knexTrx Knex transaction ("promise aware" knex connection)
 * @param {string[]} stack Stack of transaction ids
 * @param {number} Block height Stack of transaction ids
 */
async function syncTransactionFromStack(knexTrx, stack, blockHeight) {
  let promise;

  const transactionId = stack.pop();
  if (transactionId) {
    // Get raw transaction
    const rawTx = await rpc('getrawtransaction', transactionId, 1);

    // Addresses receiving funds from this transaction
    const outputs = rawTx.vout;
    // eslint-disable-next-line no-restricted-syntax
    for (const output of outputs) {
      if (output.scriptPubKey.addresses) {
        // eslint-disable-next-line no-restricted-syntax
        for (const address of output.scriptPubKey.addresses) {
          // eslint-disable-next-line no-await-in-loop
          await knexTrx('address_received')
            .insert({
              address,
              height: blockHeight,
              transaction_id: transactionId,
              output_number: output.n,
              value: output.value,
            });
        }
      }
    }

    // Addresses spending funds from this transaction
    const inputs = rawTx.vin.filter(input => !input.coinbase);
    let index = -1;
    // eslint-disable-next-line no-restricted-syntax
    for (const input of inputs) {
      index++;
      // Get address from output (call bitcoind rather than lookup in db
      // because the latter will no longer work reliably with CTOR/TTOR
      // after Nov 18 hardfork - pity).
      // eslint-disable-next-line no-await-in-loop
      const outputTx = await rpc('getrawtransaction', input.txid, 1);
      const output = outputTx.vout[input.vout];
      if (output.scriptPubKey.addresses) {
        // eslint-disable-next-line no-restricted-syntax
        for (const address of output.scriptPubKey.addresses) {
          // eslint-disable-next-line no-await-in-loop
          await knexTrx('address_spent')
            .insert({
              address,
              height: blockHeight,
              transaction_id: transactionId,
              input_number: index,
              value: output.value,
            });
        }
      }
    }

    // Use recursion to keep processing until stack is exhuasted
    promise = syncTransactionFromStack(knexTrx, stack, blockHeight);
  }

  return promise;
}

/**
 * Populates the database table 'address' with addresses from inputs and outputs
 * for the transactions in the provided block
 *
 * @param {*} knexTrx         Knex transaction ("promise aware" knex connection)
 * @param {*} block           Full block details provided by bitcoind
 */
export default async function syncAddresses(knexTrx, block) {
  // Can't get transactions for the genesis block
  if (block.height === 0) {
    return;
  }

  // Create stack of txids to be synced
  const stack = block.tx.slice();

  // Split stack into separate arrays for each thread.  Not sure if necessary
  // but there's a sporadic production bug that I can only put down to
  // a problem with the virtual threads all popping the next transaction
  // off of the same array
  const transactionsPerVirtualThread = Math.ceil(stack.length / MAX_CONCURRENT_TRANSACTIONS);

  // Create array of concurrent promises
  const promises = [];
  for (let count = 0; count < MAX_CONCURRENT_TRANSACTIONS; count++) {
    const stackFromIndex = count * transactionsPerVirtualThread;
    const stackToIndex = stackFromIndex + transactionsPerVirtualThread;
    const stackPortion = stack.slice(stackFromIndex, stackToIndex);
    promises.push(syncTransactionFromStack(
      knexTrx,
      stackPortion,
      block.height,
    ));
  }

  // Resolve all promises
  await Promise.all(promises);
}
