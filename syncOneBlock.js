
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
              .select('block.tx_count')
              .sum('transaction.input_count as inputs')
              .sum('transaction.output_count as outputs')
              .where('block.height', nextBlock)
              .join('transaction', 'block.height', 'transaction.block_height')
              .groupBy('tx_count')
              .first()
              .then((results) => {
                const { tx_count, inputs, outputs } = results;
                const endTime = Date.now();
                const elapsedSecs = (endTime - startTime) / 1000;
                const txPerSecond = tx_count / elapsedSecs;

                // Output block, seconds, tx count, tx per second, inputs, outputs
                console.log(`${nextBlock}, ${elapsedSecs}, ${tx_count}, ${txPerSecond.toFixed(2)}, ${inputs}, ${outputs}`);
                process.exit(0);
              });
          });
      });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
