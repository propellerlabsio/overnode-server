const tableName = 'sync';

exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) =>{
    return table
      .boolean('critical')
      .comment('Sync is critical; clients are directly affected.');
  }).then(() => {
    return Promise.all([
      knex(tableName).where('name', '<>', 'adjust_data_2').update('critical', true),
      knex(tableName).where('name', '=', 'adjust_data_2').update('critical', false),
    ]);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) =>{
    return table
      .dropColumn('critical')
  });
};
