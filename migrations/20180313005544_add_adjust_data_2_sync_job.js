/**
 * Add sync table job record for adjusting data (second / 2)
 * 
 * This job will move data from the output_address table to the 
 * output table where the output only has a single address (most of them)
 */
const tableName = 'sync';
const syncName = 'adjust_data_2';

exports.up = function (knex) {
  // Get height of existing populate transactions job
  return knex('sync')
    .where('name', 'populate_transaction_tables')
    .first()
    .then((transactionsJob) => {
      let adjustDataJob = {
        name: syncName,
      }
      // Existing or new install?
      if (transactionsJob.to_height > 0) {
        // Create sync adjust data job to start approx 1 days before
        // blocks sync height
        let heightADayEarlier = transactionsJob.to_height - (
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

        // Only need to convert (adjust data) for blocks that were processed prior to this version
        // Transactions processed from this version onwards will use new logic
        adjustDataJob.min_height = transactionsJob.from_height; 
        adjustDataJob.max_height = transactionsJob.to_height;
      } else {
        // New install, transactions not synced yet so this job is not necessary
        adjustDataJob.min_height = 0; 
        adjustDataJob.max_height = 0;
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
