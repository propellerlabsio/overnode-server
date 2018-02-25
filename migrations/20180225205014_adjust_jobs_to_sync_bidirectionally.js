const tableName = 'job';

exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    return Promise.all([
      table.renameColumn('function_name', 'name'),
      table.renameColumn('height', 'to_height'),
      table.integer('from_height').comment('Height of earliest block processed'),
    ]);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    return Promise.all([
      table.renameColumn('name', 'function_name'),
      table.renameColumn('to_height', 'height'),
      table.dropColumn('from_height'),
    ]);
  });
};
