const tableName = 'output';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    table.increments();
    table.comment('An output in a bitcoin transaction')
    table.string('transaction', 64);
    table.integer('number').comment('Output number indexed from 0');
    table.float('value', 16, 8);

    // Indexes / foreign keys
    table.unique(['transaction', 'number'], 'transaction_outputs')
    table.foreign('transaction').references('transaction.id')
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};