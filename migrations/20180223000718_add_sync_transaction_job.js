const tableName = 'job';
const functionName = 'sync_transaction';

exports.up = function (knex) {
  return knex(tableName).insert({
    function_name: functionName,
    height: 99999999,   // TODO, set this to -1 when we are ready to sync
    error_height: null,
  });
};

exports.down = function (knex) {
  return knex(tableName)
    .where('function_name', functionName)
    .delete();
};