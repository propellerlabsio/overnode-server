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
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};