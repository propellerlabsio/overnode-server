const tableName = 'job';
const functionName = 'populate_block_table';

exports.up = function (knex) {
  return knex(tableName).insert({
    function_name: functionName,
    height: -1,
  });
};

exports.down = function (knex) {
  return knex(tableName)
    .where('function_name', functionName)
    .delete();
};