/* Ignore await in loop - deliberate synchronous job processing.               */
/* eslint-disable no-await-in-loop                                             */
/* Allow arguments in curly braces on same line as function definition because */
/* eslint-disable object-curly-newline                                         */
/* Allow console messages from this file only (important log info)             */
/* eslint-disable no-console                                                   */

import { db, upsert } from '../io/db';
import functions from './sync/functions';
import { request as rpc } from '../io/rpc';
import { middleTrim } from '../util/strings';

const syncCollection = db.collection('sync');
const errorCollection = db.collection('sync_errors');

const sync = {

  // Constants
  FORWARD: 1,
  BACKWARD: -1,

  /**
   * Return single sync job uniquely identified by name
   */
  get: async ({ name }) => {
    let [job] = await syncCollection.lookupByKeys([name]);
    if (!job) {
      job = {
        name,
        from_height: 0,
        to_height: -1, // next block is first - ie zero
      };
    }

    return job;
  },

  /**
   * Return how much of the blockchain has been synced to the database
   *
   * @returns {[height]}  Array containing from and to blockheight
   */
  async getCoverage() {
    const cursor = await db.query(`
      for job in sync 
        collect
        aggregate from = max(job.from_height), to = min(job.to_height)
        return {
          from, 
          to 
    }`);
    const coverage = await cursor.next();
    if (coverage.from === null) {
      coverage.from = 0;
    }
    if (coverage.to === null) {
      coverage.to = -1; // next block is first block - ie 0
    }

    return coverage;
  },

  /**
   * Return all sync jobs
   */
  find: () => db.query('for job in sync return job').all(),

  /**
   * Return all sync errors matching criteria
   */
  // TODO implement paging
  // eslint-disable-next-line
  findError: ({ paging }) =>
    errorCollection
      .all(),
  // .offset(paging.offset)
  // .limit(paging.limit)
  // .orderBy('height'),

  /**
   * Execute a given sync job with a given block
   */
  execute: async ({ name, block, direction, reprocess = false }) => {
    try {
      // Get sync job details
      const job = await sync.get({ name });

      // Check if this block is outside of range already processed
      if (!reprocess) {
        if (block.height >= job.from_height && block.height <= job.to_height) {
          // Already processed this block and no reprocess requested so exit
          return;
        }
      }

      // Execute sync job
      // TODO convert to arangodb transaction
      await functions[name](block);

      // If we get this far, clear any previous errors
      await sync.clearError(block.height, name);

      // Record block as processed so next block can be picked up
      await sync.update({
        name,
        newHeight: block.height,
        direction,
      });
    } catch (error) {
      // Log error and play on
      await sync.logError({
        height: block.height,
        name,
        message: error.message,
      });

      // Record block as attempted so next block can be picked up
      await sync.update({
        name,
        newHeight: block.height,
        direction,
      });

      // Rethrow error to caller
      throw error;
    }
  },

  logError: async ({ height, name, message }) => {
    const trimmedMessage = middleTrim(message, 255);

    // TODO remove
    console.error(`Sync error at height ${height} in job ${name}, message: ${trimmedMessage}`);

    await upsert(errorCollection, {
      _key: `${name}:${height}`,
      height,
      name,
      message: trimmedMessage,
    });
  },

  async clearError(height, name) {
    await errorCollection
      .removeByExample({
        _key: `${name}:${height}`
      });
  },

  /**
   * Update sync job details in the database
   */
  update: ({ name, newHeight, direction }) => {
    const updateValues = {
      _key: name,
    };

    if (newHeight !== undefined) {
      if (direction === sync.FORWARD) {
        updateValues.to_height = newHeight;
      } else {
        updateValues.from_height = newHeight;
      }
    }

    // Do update
    return upsert(syncCollection, updateValues);
  },


  /**
   * Process sync jobs that haven't been run yet from fromHeight to toHeight
   */
  process: async ({ fromHeight, toHeight, direction }) => {
    // Validate params
    if (direction !== sync.FORWARD && direction !== sync.BACKWARD) {
      throw new Error('Invalid or no sync direction provided.');
    }

    // For each block in range
    for (let height = fromHeight; height !== (toHeight + direction); height += direction) {
      try {
        // Get block hash for height
        // (Unlike BU, ABC node can't accept height as argument for getblock)
        const hash = await rpc('getblockhash', height);

        // Get block.
        const block = await rpc('getblock', hash);

        // Populate block table
        await sync.execute({ name: 'populate_block_table', block, direction });

        // Sync transaction to database
        await sync.execute({ name: 'populate_transaction_tables', block, direction });
      } catch (err) {
        console.log(`Sync skipping block ${height} due to error: ${middleTrim(err.message, 256)}`);
      }
    }
  },
};

export default sync;
