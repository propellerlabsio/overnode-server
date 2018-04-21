const tableName = 'job';
const functionName = 'populate_block_table';

exports.up = function (knex) {
  return knex(tableName).insert([{
    name: 'populate_block_table',
    from_height: -1,
    to_height: null,
  }, {
    name: 'populate_transaction_tables',
    from_height: -1,
    to_height: null,
  }]);
};

exports.down = function (knex) {
  return knex(tableName)
    .where('name', 'populate_block_table')
    .orWhere('name', 'populate_transaction_tables')
    .delete();
};