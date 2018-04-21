const tableName = 'transaction';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    table.comment('A bitcoin transaction')

    // Fields
    table.string('transaction_id', 64).primary();
    table.integer('transaction_number').comment('Transaction number in block indexed from 0');
    table.integer('size');
    table.integer('time');  // Y2038 bug
    table.integer('input_count');
    table.integer('output_count');
    table.integer('block_height');

    // Indexes
    table.index('block_height');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};