
/**
 * Remove redundant id primary key from input staging table
 */

const tableName = 'input_staging';

exports.up = function(knex, Promise) {
    // Need to look up constraint name as it changes if knex:migrate rollback then latest is employed
    return knex.table('information_schema.table_constraints')
      .select('constraint_name')
      .where('table_name', tableName)
      .andWhere('constraint_type', 'PRIMARY KEY')
      .first()
      .then((data) => {
        return knex.schema.table(tableName, (table) => {
          return table.dropPrimary(data.constraint_name);
        });
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
