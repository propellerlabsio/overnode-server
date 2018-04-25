const tableName = 'sync';

exports.up = function (knex) {
  return knex(tableName).insert([{
    name: 'populate_block_table',
    from_height: 0,
    to_height: -1,
  }, {
    name: 'populate_transaction_tables',
    from_height: 0,
    to_height: -1,
  }]);
};

exports.down = function (knex) {
  return knex(tableName)
    .where('name', 'populate_block_table')
    .orWhere('name', 'populate_transaction_tables')
    .delete();
};