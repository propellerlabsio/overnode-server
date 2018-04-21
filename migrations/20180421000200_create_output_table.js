const tableName = 'output';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    table.comment('An output in a bitcoin transaction')
    table.string('transaction_id', 64);
    table.integer('output_number').comment('Output number indexed from 0');
    table.float('value', 16, 8);
    table.string('address', 42)
      .comment('Output address if output has single address.  Refer output_address if blank for multiple addresses');

    table.primary(['transaction_id', 'output_number']);
    table.index('address', null, 'HASH');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};