const tableName = 'job';

exports.up = function (knex) {
  return knex
    .schema
    .createTable(tableName, function (table) {
      table.increments();
      table.string('function_name', 64);
      table.integer('height');
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};