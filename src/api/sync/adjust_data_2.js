/**
 * Migrates addresses from output_address to output where output has only single
 * address.
 */

/* Ignore camel case requirement for function names.  These names are visible */
/* to non-programmers:                                                        */
/* eslint-disable camelcase                                                   */

import { knex } from '../../knex';

async function processOutputs(outputs) {
  const nextOutput = outputs.pop();
  if (!nextOutput) {
    return;
  }

  const { address } = await knex('output_address')
    .select('address')
    .where('transaction_id', nextOutput.transaction_id)
    .andWhere('output_number', nextOutput.output_number)
    .first();

  await knex('output')
    .where('transaction_id', nextOutput.transaction_id)
    .andWhere('output_number', nextOutput.output_number)
    .update({
      address,
    })
    .then(() => {
      return knex('output_address')
        .where('transaction_id', nextOutput.transaction_id)
        .andWhere('output_number', nextOutput.output_number)
        .delete();
    });

  await processOutputs(outputs);
}
async function processTransactions(transactionIds) {
  // Get next transaction id to process
  const transactionId = transactionIds.pop();
  if (!transactionId) {
    return;
  }

  const outputs = await knex('transaction')
    .join('output', 'transaction.transaction_id', '=', 'output.transaction_id')
    .join('output_address', {
      'output_address.transaction_id': 'output.transaction_id',
      'output_address.output_number': 'output.output_number',
    })
    .select('output_address.transaction_id', 'output_address.output_number')
    .count('output_address.address')
    .where('transaction.transaction_id', transactionId)
    .groupBy('output_address.transaction_id', 'output_address.output_number');

  const singleAddressOutputs = outputs.filter(record => Number(record.count) === 1);

  await processOutputs(singleAddressOutputs);

  await processTransactions(transactionIds);
}

/**
 * Populates the transaction table 'height' field
 *
 * @param {*} block           Full block details provided by bitcoind
 */
export default async function adjust_data_2(block) {
  const transactionIds = block.tx.slice();
  await processTransactions(transactionIds);
}
