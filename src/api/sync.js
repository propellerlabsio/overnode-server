/* Ignore await in loop - deliberate synchronous job processing.               */
/* eslint-disable no-await-in-loop                                             */
/* Allow arguments in curly braces on same line as function definition because */
/* eslint-disable object-curly-newline                                         */

import { knex } from '../knex';
import functions from './sync/functions';
import { request as rpc } from '../rpc';

const sync = {
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

    // eslint-disable-next-line no-console
    console.info('Error state of sync jobs has been reset for reattempting');
  },

  /**
   * Execute a given sync job with a given block
   */
  execute: async ({ name, block }) => {
    const job = await sync.get({ name });

    return knex.transaction(async (knexTransaction) => {
      try {
        if (job.to_height + 1 === block.height && job.error_height === null) {
          await functions[job.name](block, knexTransaction);
          await sync.update({
            name,
            toHeight: block.height,
            knexTransaction,
          }).transacting(knexTransaction);
          await knexTransaction.commit();
        }
      } catch (err) {
        // Can't use await in catch block; go oldskool
        knexTransaction
          .rollback()
          .then(() => {
            sync.update({
              name,
              errorHeight: block.height,
              errorMessage: err.message,
            }).then(() => {
              // eslint-disable-next-line no-console
              console.error(`Sync job '${job.name}' failed with error: ${err.message}`);
            });
          });

        // Rethrow error to caller
        throw err;
      }
    });
  },

  /**
   * Update sync job details in the database
   */
  update: ({ name, fromHeight, toHeight, errorHeight, errorMessage }) => {
    const updateValues = {};
    if (fromHeight !== undefined) {
      updateValues.from_height = fromHeight;
    }

    if (toHeight !== undefined) {
      updateValues.to_height = toHeight;
    }

    if (errorHeight !== undefined) {
      updateValues.error_height = errorHeight;
      updateValues.error_message = errorMessage;
    }

    // Do update
    return knex('sync')
      .where('name', name)
      .update(updateValues);
  },


  /**
   * Process sync jobs that haven't been run yet from fromHeight to toHeight
   */
  process: async ({ fromHeight, toHeight }) => {
    try {
      // For each block in range
      for (let height = fromHeight; height <= toHeight; height++) {
        // Get block.
        const block = await rpc('getblock', height.toString());

        // Populate block table
        await sync.execute({ name: 'populate_block_table', block });

        // Sync transaction to database
        await sync.execute({ name: 'sync_transaction', block });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('Stopping sync job processing due to error: ', err.message);
    }
  },
};

export default sync;
