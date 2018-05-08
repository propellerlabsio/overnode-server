
/* Allow console messages in this module */
/* eslint-disable camelcase  */

const logger = require('winston');
// Load local environment variables first before any other action
require('dotenv').config();

const sync = require('./dist/api/sync').default;
const rpc = require('./dist/io/rpc');
const { knex } = require('./dist/io/knex');

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
        const startTime = Date.now();
        console.log(`Syncing block ${nextBlock}`);
        sync
          .process({
            fromHeight: nextBlock,
            toHeight: nextBlock,
            direction: sync.FORWARD,
          })
          .then(() => {
            logger.profile('all');
            logger.stream({ start: -1 })
              .on('log', (log) => {
                console.log(log);
              });
            knex('block')
              .select('tx_count')
              .where('height', nextBlock)
              .first()
              .then(({ tx_count }) => {
                const endTime = Date.now();
                const elapsedSecs = (endTime - startTime) / 1000;
                const txPerSecond = tx_count / elapsedSecs;

                // Output block, tx count, tx per second
                console.log(`${nextBlock}, ${tx_count}, ${txPerSecond.toFixed(2)}`);
                process.exit(0);
              });
          });
      });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
