const tableName = 'sync';

exports.up = function (knex) {
  return knex
    .schema
    .createTable(tableName, function (table) {
      table.string('name', 64)
        .primary()
        .comment('Name of function to be called for this job');
      table.integer('from_height').comment('Height of earliest block processed'),
      table.integer('to_height').comment('Height of last block processed');
      table.integer('min_height').comment('Minimum block height that this sync should be performed');
      table.integer('max_height').comment('Maximum block height that this sync should be performed');
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};