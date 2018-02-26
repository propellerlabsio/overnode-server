const tableName = 'output';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    table.increments();
    table.comment('An output in a bitcoin transaction')
    table.string('transaction_id', 64);
    table.integer('output_index').comment('Output number indexed from 0');
    table.float('value', 16, 8);

    // Indexes / foreign keys
    table.unique(['transaction_id', 'output_index'], 'transaction_outputs')
    table.foreign('transaction_id').references('transaction.transaction_id')
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};