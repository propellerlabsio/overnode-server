const tableName = 'transaction';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    table.comment('A bitcoin transaction')
    table.string('transaction_id', 64).primary();
    table.integer('size');
    table.string('block_hash', 64);
    table.integer('time');  // Y2038 bug

    // Foreign keys
    table.foreign('block_hash').references('block.hash');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};