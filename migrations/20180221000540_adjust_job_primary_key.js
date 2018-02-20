
const tableName = 'job';
exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) =>{
    return table.dropPrimary();
  }).then(() => {
    return knex.schema.table(tableName, (table) => {
      table.dropColumn('id');
      table.primary('function_name');
    });
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) =>{
    return table.dropPrimary();
  }).then(() => {
    return knex.schema.table(tableName, (table) => {
      table.increments();
    });
  });
};
