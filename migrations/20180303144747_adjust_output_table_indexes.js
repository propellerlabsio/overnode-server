
/**
 * Remove redundant id primary key from output table
 */

const tableName = 'output';

exports.up = function(knex, Promise) {
    return knex.schema.table(tableName, (table) => {
      return table.dropPrimary();
    }).then(() => {
      return knex.schema.table(tableName, (table) => {
        return table.dropColumn('id');
      });
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    // Recreate id / primary key field
    return table.increments('id');
  })
};
