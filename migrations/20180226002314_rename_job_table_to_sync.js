
exports.up = function(knex, Promise) {
  return knex.schema.renameTable('job', 'sync');
};

exports.down = function(knex, Promise) {
  return knex.schema.renameTable('sync', 'job');
};
