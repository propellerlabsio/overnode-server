/**
 * Remove constraints on output table for performance
 * 
 * This data is sourced from the bitcoind daemon and should be
 * validated (referentially consistent) already plus with tens of 
 * millions of of rows the constraints potentially slow down inserts
 * therefore our database sync.
 */
const tableName = 'transaction';

exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    return table.dropForeign('block_hash');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    return table.foreign('block_hash').references('block.hash');
  });
};
