const tableName = 'block';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    table.string('hash', 64).primary();
    table.integer('size');
    table.integer('height');
    table.integer('time');  // Y2038 bug
    table.integer('timesinceprevious')
    table.string('previousblockhash', 64);
    table.string('nextblockhash', 64);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};