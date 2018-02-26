/**
 * Add sync table job record for syncing transactions
 */
const tableName = 'sync';
const syncName = 'populate_transaction_tables';

exports.up = function (knex) {
  // Get height of existing populate blocks job
  return knex('sync')
    .select('to_height')
    .where('name', 'populate_block_table')
    .first()
    .then((blocksJob) => {
      let transactionsJob = {
        name: syncName,
      }
      // Existing or new install?
      debugger;
      if (blocksJob.to_height > 0) {
        // Create sync transaction job to start approx 7 days before
        // blocks sync height
        let heightSevenDaysEarlier = blocksJob.to_height - (
          6 * // blocks per hour
          24 * // hours per day
          7 // days per week
        )
        if (heightSevenDaysEarlier < 0) {
          transactionsJob.from_height = 0; // No backward syncing
          transactionsJob.to_height = -1;  // Sync forward; next (first) block is 0
        } else {
          transactionsJob.from_height = heightSevenDaysEarlier + 1; // Backward sync from here (next is -1)
          transactionsJob.to_height = heightSevenDaysEarlier;  // Sync forward; next (first) block is this + 1;
        }
      } else {
        // New install, blocks not synced yet so just start at the beginning for transactions too
          transactionsJob.from_height = 0; // No backward syncing
          transactionsJob.to_height = -1;  // Sync forward; next (first) block is 0
      }

      // Insert sync transactions job
      return knex(tableName).insert(transactionsJob);
    });
};

exports.down = function (knex) {
  return knex(tableName)
    .where('name', syncName)
    .delete();
};
