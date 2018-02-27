/**
 * Add indexes for common query performance to tranaction tables.
 */

const tableName = 'output';

exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('output', table => table.index(['transaction_id'], 'transaction_id')),
    knex.schema.table('output_address', table => table.index(['transaction_id', 'output_index'], 'transaction_ouput')),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('output', table => table.dropIndex('transaction_id')),
    knex.schema.table('output_address', table => table.dropIndex('transaction_ouput')),
  ]);
};
