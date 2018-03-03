
const tableName = 'user';
const oldColumnName = 'name';
const newColumnName = 'email';

exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    table.renameColumn(oldColumnName, newColumnName);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    table.renameColumn(newColumnName, oldColumnName);
  });
};
