const tableName = 'output';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    // Fields
    table.comment('An output in a bitcoin transaction')
    table.string('transaction_id', 64);
    table.integer('output_number').comment('Output number indexed from 0');
    table.decimal('value', 16, 8);
    table.string('address', 42)
      .comment('Output address if output has single address.  Refer output_address if blank for multiple addresses');
    table.string('input_transaction_id', 64).comment('Transaction where output was spent');
    table.integer('input_number').comment('Input number indexed from 0 in transaction where output was spent');

    // Indexes
    table.primary(['transaction_id', 'output_number']);
    table.index(['input_transaction_id', 'input_number']);
    table.index('address', null, 'HASH');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};