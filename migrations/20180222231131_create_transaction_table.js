const tableName = 'transaction';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    table.comment('A bitcoin transaction')
    table.string('transaction_id', 64).primary();
    table.integer('transaction_index').comment('Transaction number in block indexed from 0');
    table.integer('size');
    table.string('block_hash', 64);
    table.integer('time');  // Y2038 bug
    table.integer('input_count');
    table.integer('output_count');

    // Foreign keys and indexes
    table.foreign('block_hash').references('block.hash');
    table.index('block_hash');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};