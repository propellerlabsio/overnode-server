/*
 * Thejob 'adjust_data_1' converts the transaction table to store block height 
 * instead of hash.  The code for syncing transactions has also been updated to do this
 * already so the adjust job only has to run for transactions that were synced before
 * the change.  This migration sets the min_height and max_height values to prevent
 * the 'adjust_data_1' job from running for newly synced transactions.
 */

exports.up = function(knex, Promise) {
  return knex('sync')
    .where('name', 'populate_transaction_tables')
    .first()
    .then((transactionJob) => {
      return knex('sync')
        .where('name', 'adjust_data_1')
        .update({
          min_height: transactionJob.from_height,
          max_height: transactionJob.to_height,
        });
    });
};

exports.down = function(knex, Promise) {
  return knex('sync')
    .where('name', 'adjust_data_1')
    .update({
      min_height: null,
      max_height: null,
    });
};
