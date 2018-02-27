/* Ignore await in loop - deliberate synchronous job processing.               */
/* eslint-disable no-await-in-loop                                             */
/* Allow arguments in curly braces on same line as function definition because */
/* eslint-disable object-curly-newline                                         */
/* Allow console messages from this file only (important log info)             */
/* eslint-disable no-console                                                   */

import { knex } from '../knex';
import functions from './sync/functions';
import { request as rpc } from '../rpc';
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
   * Return all sync jobs matching options
   */
  find: ({ onlyJobsInError }) => {
    let query = knex('sync').select();
    if (onlyJobsInError) {
      query = query.whereNotNull('error_message');
    }
    return query;
  },

  /**
   * Reset the error status of all sync jobs.
   *
   * This can be useful on server restart so that jobs will be reattempted at least once.
   * This allows the admin to fix any underlying issues and restart the server without having
   * to update flags in database fields.
   */
  resetErrors: async () => {
    await knex('sync')
      .whereNotNull('error_height')
      .update({
        error_height: null,
        error_message: null,
      });

    console.info('Error state of sync jobs has been reset for reattempting');
  },

  /**
   * Backwards sync any jobs that have a from-height of greater than zero.
   *
   * Normal sync operations are forward however it is useful to deploy
   * new sync jobs at a recent block height and allow users to continue
   * to use the service while a second process (this one) backwards
   * syncs back to block height 0.
   */
  backSync: async () => {
    try {
      // Get maximum 'from_height' that isn't zero
      const { max } = await knex('sync')
        .max('from_height')
        .where('from_height', '>=', 0)
        .first();

      // Start syncing
      if (max) {
        console.log('Starting backwards syncing');
        await sync.process({
          fromHeight: max - 1,
          toHeight: 0,
          direction: sync.BACKWARD,
        });
        console.log('Backwards syncing complete');
      }
    } catch (err) {
      console.error('Error back-syncing: ', middleTrim(err.message, 256));
    }
  },

  /**
   * Execute a given sync job with a given block
   */
  execute: async ({ name, block, direction }) => {
    // Do database changes in a knex/db transaction.
    await knex.transaction((knexTransaction) => {
      return sync
        .get({ name })
        .then(async (job) => {
          let result;
          const alreadySynced = block.height >= job.from_height && block.height <= job.to_height;
          if (job.error_height === null && !alreadySynced) {
            await functions[job.name](block, knexTransaction);
            await sync.update({
              name,
              newHeight: block.height,
              direction,
              knexTransaction,
            }).transacting(knexTransaction);
            result = knexTransaction.commit();
          } else {
            result = null;
          }
          return result;
        })
        .catch(async (error) => {
          await knexTransaction.rollback(error);
        });
    }).catch(async (error) => {
      // If error in above db transaction, log to database.  Need to do this outside of
      // above db transaction
      console.error(`Sync job '${name}' (direction: ${direction}) failed with error: ${middleTrim(error.message, 256)}`);
      await sync.update({
        name,
        errorHeight: block.height,
        errorMessage: error.message,
      });

      // Rethrow error to caller
      throw error;
    });
  },

  /**
   * Update sync job details in the database
   */
  update: ({ name, newHeight, direction, errorHeight, errorMessage }) => {
    const updateValues = {};

    if (newHeight !== undefined) {
      if (direction === sync.FORWARD) {
        updateValues.to_height = newHeight;
      } else {
        updateValues.from_height = newHeight;
      }
    }

    if (errorHeight !== undefined) {
      updateValues.error_height = errorHeight;
      updateValues.error_message = middleTrim(errorMessage, 255);
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

    // Process blocks
    try {
      // For each block in range
      for (let height = fromHeight; height !== (toHeight + direction); height += direction) {
        // Get block.
        const block = await rpc('getblock', height.toString());

        // Populate block table
        await sync.execute({ name: 'populate_block_table', block, direction });

        // Sync transaction to database
        await sync.execute({ name: 'populate_transaction_tables', block, direction });
      }
    } catch (err) {
      console.log('Stopping sync job processing due to error: ', middleTrim(err.message, 256));
    }
  },
};

export default sync;
