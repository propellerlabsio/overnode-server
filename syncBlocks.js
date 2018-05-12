
/* Allow console messages in this module */
/* eslint-disable camelcase, no-console */

// Load local environment variables first before any other action
require('dotenv').config();

const sync = require('./dist/api/sync').default;
const rpc = require('./dist/io/rpc');
const logger = require('winston');

const numBlocks = process.argv[2] || 1;

/**
 * Sync next block according to coverage in database
 */
async function syncBlock() {
  // Get current coverage
  await sync
    .getCoverage()
    .then(({ to }) => {
      const nextBlock = to + 1;
      // const startTime = Date.now();
      return sync
        .process({
          fromHeight: nextBlock,
          toHeight: nextBlock,
          direction: sync.FORWARD,
        })
        .then(() => {
          // logger.profile('all');
          // logger.stream({ start: -1 })
          //   .on('log', (log) => {
          //     console.log(log);
          //   });
          // knex('block')
          //   .select('block.tx_count', 'block.size')
          //   .sum('transaction.input_count as inputs')
          //   .sum('transaction.output_count as outputs')
          //   .where('block.height', nextBlock)
          //   .join('transaction', 'block.height', 'transaction.block_height')
          //   .groupBy('tx_count', 'block.size')
          //   .first()
          //   .then((results) => {
          //     const { tx_count, size, inputs, outputs } = results;
          //     const endTime = Date.now();
          //     const elapsedSecs = (endTime - startTime) / 1000;
          //     const txPerSecond = tx_count / elapsedSecs;

          //     // Output block, seconds, tx count, tx per second, inputs, outputs
          //     console.log('height, seconds, txs, tx_per_sec, inputs, outputs');
          //     console.log(`${nextBlock}, ${size}, ${tx_count},
          //                    ${txPerSecond.toFixed(2)}, ${inputs}, ${outputs}`);
          // process.exit(0);
          // });
        });
    });
}

async function syncBlocks(total) {
  try {
    await syncBlock();
    const remaining = total - 1;
    if (remaining > 0) {
      await syncBlocks(remaining);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

async function start() {
  const logText = `Sync ${numBlocks} blocks`;
  logger.profile(logText);
  await rpc.initialize();
  await syncBlocks(numBlocks);
  logger.profile(logText);
  logger.stream({ start: -1 })
    .on('log', (log) => {
      console.log(log);
    });
}

start();
