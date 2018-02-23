const tableName = 'output_address';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    table.comment('An address in an output of a bitcoin transaction')
    table.increments();
    // Note: at time of insert we don't know the value of the corresponding
    // output table record so we can't reference it here but have to
    // repeat the transaction and output number fields from that table.
    table.string('transaction', 64);
    table.integer('number').comment('Output number indexed from 0');
    table.string('address', 42);

    // Indexes / foreign keys
    table
      .foreign(['transaction', 'output_number'])
      .references('transaction_outputs');
    table.index('address');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};