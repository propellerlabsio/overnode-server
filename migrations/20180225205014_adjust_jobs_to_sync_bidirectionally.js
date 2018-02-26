const tableName = 'job';

exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    return Promise.all([
      table.renameColumn('function_name', 'name'),
      table.renameColumn('height', 'to_height'),
      table.integer('from_height').comment('Height of earliest block processed'),
    ]).then(() => {
      return knex(tableName).update('from_height', 0);
    });
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