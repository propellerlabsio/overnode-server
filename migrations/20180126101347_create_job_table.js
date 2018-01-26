const tableName = 'job';

exports.up = function (knex) {
  return knex
    .schema
    .createTable(tableName, function (table) {
      table.increments();
      table.string('function_name', 64).comment('Name of function to be called for this job');
      table.integer('height').comment('Height of last block processed');
      table.integer('error_height').comment('If not null, then block at which job errored and stopped processing.');
      table.string('error_message').comment('Message of error occuring at error_height');
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};