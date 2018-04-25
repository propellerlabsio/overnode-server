const tableName = 'block';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    table.string('hash', 64).primary();
    table.integer('size');
    table.integer('height');
    table.integer('time');  // Y2038 bug
    table.integer('tx_count');
    table.integer('interval').comment('Interval in seconds since last block');
    table.string('coinbase', 200);
    table.index('height');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};