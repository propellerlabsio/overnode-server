const tableName = 'sync';

exports.up = function (knex) {
  return knex(tableName).insert([{
    name: 'syncAddresses',
    from_height: 0,
    to_height: -1,
  }]);
};

exports.down = function (knex) {
  return knex(tableName)
    .where('name', 'syncAddresses')
    .delete();
};