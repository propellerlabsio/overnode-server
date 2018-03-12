/**
 * Adds min_height and max_height fields to sync table.
 * 
 * Some sync jobs (e.g. data adjustments) only need to be performed for a certain block
 * range.  Setting these fields will prevent the sync from executed at a block height
 * outside the range.
 * 
 * For example, job 'adjust_data_1' converts the transaction table to store block height 
 * instead of hash.  The code for syncing transactions has also been updated to do this
 * already so the adjust job only has to run for transactions that were synced before
 * the change.
 */

exports.up = function(knex, Promise) {
  return knex.schema.table('sync', (table) => {
    return Promise.all([
      table.integer('min_height').comment('Minimum block height that this sync should be performed'),
      table.integer('max_height').comment('Maximum block height that this sync should be performed'),
    ]);
  });
  
};

exports.down = function(knex, Promise) {
  return knex.schema.table('sync', (table) => {
    return Promise.all([
      table.dropColumn('min_height'),
      table.dropColumn('max_height'),
    ]);
  });
};
