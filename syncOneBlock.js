
/* Allow console messages in this module */
/* eslint-disable no-console             */

const logger = require('winston');
// Load local environment variables first before any other action
require('dotenv').config();

const sync = require('./dist/api/sync').default;
const rpc = require('./dist/io/rpc');

logger.profile('all');

// Initialize and test rpc connection
rpc
  .initialize()
  .then(() => {
    // Get current coverage
    sync
      .getCoverage()
      .then(([{ from }, { to }]) => {
        const nextBlock = to + 1;
        console.log(`Syncing block ${nextBlock}`);
        sync
          .process({
            fromHeight: nextBlock,
            toHeight: nextBlock,
            direction: sync.FORWARD,
          })
          .then(() => {
            logger.profile('all');
            logger.stream({ start: -1 }).on('log', (log) => {
              console.log(log);
            });
            process.exit(0);
          });
      });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
