
/**
 * Rename columns that have the word "index" to use the word "number"
 */

const tableName = 'input_staging';

exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    return Promise.all([
      table.renameColumn('input_index', 'input_number'),
      table.renameColumn('output_index', 'output_number'),
    ]);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    return Promise.all([
      table.renameColumn('input_number', 'input_index'),
      table.renameColumn('output_number', 'output_index'),
    ]);
  });
};
