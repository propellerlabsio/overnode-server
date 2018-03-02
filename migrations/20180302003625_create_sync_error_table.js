/**
 * Move sync errors into their own table so we can log errors and move on to
 * the next block.
 */

const tableName = 'sync_error';

exports.up = function (knex) {
  return knex
    .schema
    .createTable(tableName, function (table) {
      table.integer('height').primary().comment('Height of block error occurred in');
      table.string('name', 64).comment('Name of sync job error occurred in');
      table.string('message').comment('Error message');
    }).then(() => {
      return knex.schema.table('sync', (table) => {
        table.dropColumn('error_height');
        table.dropColumn('error_message');
      });
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName)
    .then(() => {
      return knex.schema.table('sync', (table) => {
        table.integer('error_height').comment('If not null, then block at which job errored and stopped processing.');
        table.string('error_message').comment('Message of error occuring at error_height');
      });
    });
};