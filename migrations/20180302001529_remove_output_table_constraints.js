/**
 * Remove constraints on output table for performance
 * 
 * This data is sourced from the bitcoind daemon and should be
 * validated (referentially consistent) already plus with tens of 
 * millions of of rows the constraints potentially slow down inserts
 * therefore our database sync.
 */
const tableName = 'output';

exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    return Promise.all([
      table.dropUnique(['transaction_id', 'output_index'], 'transaction_outputs'),
      table.dropForeign('transaction_id'),
    ]);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    return Promise.all([
      table.unique(['transaction_id', 'output_index'], 'transaction_outputs'),
      table.foreign('transaction_id').references('transaction.transaction_id'),
    ]);
  });
};
