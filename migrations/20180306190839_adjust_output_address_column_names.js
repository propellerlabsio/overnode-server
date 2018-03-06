
/**
 * Rename columns that have the word "index" to use the word "number"
 */

const tableName = 'output_address';

exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    return Promise.all([
      table.renameColumn('output_index', 'output_number'),
    ]);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    return Promise.all([
      table.renameColumn('output_number', 'output_index'),
    ]);
  });
};
