/**
 * Add sync table job record for adjusting data (first / 1)
 */
const tableName = 'sync';
const syncName = 'adjust_data_1';

exports.up = function (knex) {
  // Get height of existing populate blocks job
  return knex('sync')
    .select('to_height')
    .where('name', 'populate_block_table')
    .first()
    .then((blocksJob) => {
      let adjustDataJob = {
        name: syncName,
      }
      // Existing or new install?
      if (blocksJob.to_height > 0) {
        // Create sync adjust data job to start approx 1 days before
        // blocks sync height
        let heightADayEarlier = blocksJob.to_height - (
          6 * // blocks per hour
          24  // hours per day
        )
        if (heightADayEarlier < 0) {
          adjustDataJob.from_height = 0; // No backward syncing
          adjustDataJob.to_height = -1;  // Sync forward; next (first) block is 0
        } else {
          adjustDataJob.from_height = heightADayEarlier + 1; // Backward sync from here (next is -1)
          adjustDataJob.to_height = heightADayEarlier;  // Sync forward; next (first) block is this + 1;
        }
      } else {
        // New install, blocks not synced yet so just start at the beginning for adjust data too
        adjustDataJob.from_height = 0; // No backward syncing
        adjustDataJob.to_height = -1;  // Sync forward; next (first) block is 0
      }

      // Insert adjust data sync  job
      return knex(tableName).insert(adjustDataJob);
    });
};

exports.down = function (knex) {
  return knex(tableName)
    .where('name', syncName)
    .delete();
};
