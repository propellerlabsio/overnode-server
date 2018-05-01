const tableName = 'rpc_help';

exports.up = function(knex, Promise) {
  return knex.schema.createTable(tableName, (table) => {
    table.string('command').primary();
    table.date('updated').default('NOW');
    table.text('help');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable(tableName);
};
