/* Ignore await in loop - deliberate synchronous job processing.               */
/* eslint-disable no-await-in-loop                                             */
/* Allow arguments in curly braces on same line as function definition because */
/* eslint-disable object-curly-newline                                         */
/* Allow console messages from this file only (important log info)             */
/* eslint-disable no-console                                                   */

import { knex } from '../io/knex';
import functions from './sync/functions';
import { request as rpc } from '../io/rpc';
import { middleTrim } from '../util/strings';

const sync = {

  // Constants
  FORWARD: 1,
  BACKWARD: -1,

  /**
   * Return single sync job uniquely identified by name
   */
  get: async ({ name }) => {
    const [job] = await knex('sync').where('name', name);
    return job;
  },


  /**
   * Return how much of the blockchain has been synced to the database
   *
   * @returns {[height]}  Array containing from and to blockheight
   */
  getCoverage() {
    const fromQuery = knex('sync')
      .max('from_height as from')
      .where('min_height', null)
      .orWhere('min_height', '<', knex.raw('sync.from_height'))
      .first();
    const toQuery = knex('sync')
      .min('to_height as to')
      .where('max_height', null)
      .orWhere('max_height', '>', knex.raw('sync.to_height'))
      .first();
    return Promise.all([
      fromQuery,
      toQuery,
    ]);
  },

  /**
   * Return all sync jobs
   */
  find: () => knex('sync').select(),

  /**
   * Return all sync errors matching criteria
   */
  findError: ({ paging }) =>
    knex('sync_error')
      .select()
      .offset(paging.offset)
      .limit(paging.limit)
      .orderBy('height'),

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

      // Check if block is outside of minimum range allowed for this job
      if (job.min_height !== null && block.height < job.min_height) {
        return;
      }

      // Check if block is outside of maximum range allowed for this job
      if (job.max_height !== null && block.height > job.max_height) {
        return;
      }

      // Execute sync job
      await functions[name](block);

      // If we get this far, clear any previous errors
      await sync.clearError(block.height);

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
    const table = knex('sync_error');
    const trimmedMessage = middleTrim(message, 255);

    // May have prexisting error from previous attempt - need to find as knex doesn't do upserts
    const existing = await table.where('height', height).first();

    // Update or insert new error
    if (existing) {
      await table
        .where('height', height)
        .update({
          name,
          message: trimmedMessage,
        });
    } else {
      await table.insert({
        height,
        name,
        message: trimmedMessage,
      });
    }
  },

  clearError(height) {
    return knex('sync_error')
      .where('height', height)
      .delete();
  },

  /**
   * Update sync job details in the database
   */
  update: ({ name, newHeight, direction }) => {
    const updateValues = {};

    if (newHeight !== undefined) {
      if (direction === sync.FORWARD) {
        updateValues.to_height = newHeight;
      } else {
        updateValues.from_height = newHeight;
      }
    }

    // Do update
    return knex('sync')
      .where('name', name)
      .update(updateValues);
  },


  /**
   * Process sync jobs that haven't been run yet from fromHeight to toHeight
   */
  process: async ({ fromHeight, toHeight, direction }) => {
    // Validate params
    if (direction !== sync.FORWARD && direction !== sync.BACKWARD) {
      throw new Error('Invalid or no sync direction provided.');
    }

    // Process blocks unless/until we hit MAX_ERRORS
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
