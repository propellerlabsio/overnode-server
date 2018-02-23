const tableName = 'transaction';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    table.comment('A bitcoin transaction')
    table.string('id', 64).primary();
    table.integer('size');
    table.string('blockhash', 64);
    table.integer('time');  // Y2038 bug

    // Foreign keys
    table.foreign('blockhash').references('block.hash');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};