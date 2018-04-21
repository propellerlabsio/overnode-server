const tableName = 'input_staging';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    // Fields
    table.comment('An input to a bitcoin transaction')
    table.string('transaction_id', 64);
    table.integer('input_number').comment('Input number indexed from 0');
    table.string('coinbase', 200);
    table.string('output_transaction_id', 64);
    table.integer('output_number').comment('Output number indexed from 0');

    // Indexes
    table.primary(['transaction_id', 'input_number']);
    table.index(['output_transaction_id', 'output_number']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};