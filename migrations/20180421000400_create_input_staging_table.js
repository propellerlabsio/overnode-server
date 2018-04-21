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

    // Denormalized fields for performance.  This table is like a buffer and only used
    // temporarily during block transaction procesing.  These additional fields
    // make the processing quicker and simpler.
    table.integer('block_height');
    table.integer('transaction_number').comment('Transaction number in block indexed from 0');

    // Indexes
    table.primary(['transaction_id', 'input_number']);
    table.index(['output_transaction_id', 'output_number']);
    table.index('block_height');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};