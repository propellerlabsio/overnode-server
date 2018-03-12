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
const rpc = require('./dist/rpc');

// Initialize and test rpc connection
rpc
  .initialize()
  .then(() => {
    // Get current coverage
    sync
      .getCoverage()
      .then(([{ from }]) => {
        // If our max from height isn't zero start syncing
        if (from) {
          console.log(`Starting backwards syncing from ${from}`);
          sync
            .process({
              fromHeight: from - 1,
              toHeight: 0,
              direction: sync.BACKWARD,
            })
            .then(() => {
              console.log('Backwards syncing complete');
              process.exit(0);
            });
        } else {
          // Everything synced back to zero
          console.log('Everything already synced back to zero or min_height.');
          console.log('Quitting');
          process.exit(0);
        }
      });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
