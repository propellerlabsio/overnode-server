/**
 * Backwards sync any jobs that have a from-height of greater than zero.
 *
 * Normal sync operations are forward however it is useful to deploy
 * new sync jobs at a recent block height and allow users to continue
 * to use the service while a second process (this one) backwards
 * syncs back to block height 0.
 *
 * This script runs a backwards sync operation to sync the blockchain
 * to the database.  The regular main process only syncs forward and
 * does so as rapidly as possible while sacrificing service functionality.
 * This process has only resource impact (cpu, ram, disk) on the main process.
 *
 * This script should be launched as a separate node process well after
 * the server has been started with the regular start.js script and
 * the forward sync has been caught up.  At that point, the main process
 * will only be syncing new blocks foward (every 10 minutes or so) and this
 * process should have neglible impact.
 */

/* Allow console messages in this module */
/* eslint-disable no-console             */

// Load local environment variables first before any other action
require('dotenv').config();

const sync = require('./dist/api/sync').default;
const rpc = require('./dist/io/rpc');

// Initialize and test rpc connection
rpc
  .initialize()
  .then(() => {
    // Get current coverage
    sync
      .getCoverage()
      .then(([{ from }, { to }]) => {
        console.log(to);
        const nextBlock = to + 1;
        console.log(`Syncing block ${nextBlock}`);
        sync
          .process({
            fromHeight: nextBlock,
            toHeight: nextBlock,
            direction: sync.FORWARD,
          })
          .then(() => {
            console.log('Block synced');
            process.exit(0);
          });
      });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
