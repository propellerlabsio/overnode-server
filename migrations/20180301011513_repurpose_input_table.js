
exports.up = function(knex, Promise) {
  return knex
    .schema
    .renameTable('input', 'input_staging')
    .then(() => {
      return knex
        .schema
        .table('input_staging', table => table.dropIndex(['block_hash'], 'input_block_hash_index'))
        .then(() => {
          return knex
            .schema
            .table('input_staging', table => table.dropColumn('block_hash'));
        });
    });
};

exports.down = function(knex, Promise) {
  return knex
    .schema
    .renameTable('input_staging', 'input')
    .then(() => {
      return knex
        .schema
        .table('input', table => table.string('block_hash', 64))
        .then(() => {
          return knex
            .schema
            .table('input', table => table.index(['block_hash'], 'input_block_hash_index'));
        });
    });
    
};
