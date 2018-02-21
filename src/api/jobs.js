/* Ignore await in loop - deliberate synchronous job processing.               */
/* eslint-disable no-await-in-loop                                             */
/* Allow arguments in curly braces on same line as function definition because */
/* eslint-disable object-curly-newline                                         */

import { knex } from '../knex';
import functions from './jobs/functions';
import { request as rpc } from '../rpc';

const jobs = {
  /**
   * Return single job uniquely identified by function name
   */
  get: async ({ functionName }) => {
    const [job] = await knex('job').where('function_name', functionName);
    return job;
  },

  /**
   * Return all jobs matching options
   */
  find: ({ onlyJobsInError }) => {
    let query = knex('job').select();
    if (onlyJobsInError) {
      query = query.whereNotNull('error_message');
    }
    return query;
  },

  /**
   * Reset the error status of all jobs.
   *
   * This can be useful on server restart so that jobs will be reattempted at least once.
   * This allows the admin to fix any underlying issues and restart the server without having
   * to update flags in database fields.
   */
  resetErrors: async () => {
    await knex('job')
      .whereNotNull('error_height')
      .update({
        error_height: null,
        error_message: null,
      });

    // eslint-disable-next-line no-console
    console.info('Error state of jobs has been reset for reattempting');
  },

  /**
   * Execute a given job with a given block
   */
  execute: async ({ functionName, block }) => {
    let job = await jobs.get({ functionName });
    try {
      if (job.height + 1 === block.height && job.error_height === null) {
        job = await functions[job.function_name](job, block);
      }
      await jobs.update({
        functionName,
        height: job.height,
      });
    } catch (err) {
      await jobs.update({
        functionName,
        errorHeight: block.height,
        errorMessage: err.message,
      });

      // eslint-disable-next-line no-console
      console.error(`Job '${job.function_name}' failed with error: ${err.message}`);

      // Rethrow error to caller
      throw err;
    }
  },

  /**
   * Update job details in the database
   */
  update: ({ functionName, height, errorHeight, errorMessage }) => {
    const update = {};
    if (height) {
      update.height = height;
    }

    if (errorHeight) {
      update.error_height = errorHeight;
      update.error_message = errorMessage;
    }

    return knex('job')
      .where('function_name', functionName)
      .update(update);
  },

  /**
   * Process jobs that haven't been run yet from fromHeight to toHeight
   */
  process: async ({ fromHeight, toHeight }) => {
    try {
      // For each blockin range
      for (let height = fromHeight; height <= toHeight; height++) {
        // Get block.
        const block = await rpc('getblock', height.toString());

        // Populate block table
        await jobs.execute({ functionName: 'populate_block_table', block });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('Stopping job processing due to error');
    }
  },
};

export default jobs;
