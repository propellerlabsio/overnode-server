const tableName = 'output_address';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    table.comment('An address in an output of a bitcoin transaction')
    table.string('transaction_id', 64);
    table.integer('output_number')
      .comment('Output number indexed from 0');
    table.string('address', 42);

    // NEW indexes
    table.index(['transaction_id', 'output_number'], 'transaction_ouput');
    table.index(['address'], null, 'HASH');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};