/**
 * This script runs a backwards sync operation to sync the blockchain
 * to the database.  The regular main process only syncs forward and
 * does so as rapidly as possible while sacrificing service funcitionality.
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
    // Start backsync
    sync.backSync();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
