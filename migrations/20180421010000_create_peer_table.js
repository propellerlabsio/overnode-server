const tableName = 'peer';

exports.up = function (knex) {
  return knex
    .schema
    .createTable(tableName, function (table) {
      table.string('ip_address', 64).comment('IP address');
      table.integer('port').comment('Port number');

      table.primary(['ip_address', 'port']);
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};