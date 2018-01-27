/* eslint-disable no-await-in-loop */

import rpc from './rpc';
import { knex } from './knex';


const functions = {
  async populate_block_table(job) {
    const updatedJob = Object.assign({}, job);
    const nextBlockHeight = job.height + 1;
    let interval = 0;
    try {
      let lastBlock;
      if (nextBlockHeight > 0) {
        const lastBlockHash = await rpc('getblockhash', job.height);
        lastBlock = await rpc('getblock', lastBlockHash);
      }
      const nextBlockHash = await rpc('getblockhash', nextBlockHeight);
      const nextBlock = await rpc('getblock', nextBlockHash);
      if (lastBlock) {
        interval = nextBlock.time - lastBlock.time;
      }

      await knex('block').insert({
        hash: nextBlock.hash,
        size: nextBlock.size,
        height: nextBlock.height,
        time: nextBlock.time,
        interval,
        tx_count: nextBlock.tx.length,
        previousblockhash: nextBlock.previousblockhash,
        nextblockhash: nextBlock.nextblockhash,
      });
      updatedJob.height = nextBlockHeight;
    } catch (err) {
      updatedJob.error_height = nextBlockHeight;
      updatedJob.error_message = err.message;
    }

    return updatedJob
  },
};

export async function resetJobErrors() {
  // On server restart, clear error state of any jobs so they will be reattempted at least once.
  // This allows the admin to fix any underlying issues and restart the server without having
  // to update flags in database fields.
  knex('job')
    .whereNotNull('error_height')
    .update({
      error_height: null,
      error_message: null,
    })
    .then(() => {
      // eslint-disable-next-line no-console
      console.info('Error state of jobs has been reset for reattempting'); 
    });
}


export async function collate() {
  console.debug('Collate started');
  const { blocks } = await rpc('getinfo');
  const bestBlockHeight = blocks - 1; // TODO check if subtract 1 is necessary

  // Get collation jobs sorted by progress from lowest/earliest block height
  // Where job block height is less than current best block height
  const jobs = await knex('job')
    .select()
    .where('height', '<', bestBlockHeight)
    .orderBy('height');

  // Process jobs
  jobs.forEach(async (job, index) => {
    let updatedJob;
    for (let index = 0; index < process.env.COLLATION_JOB_CHUNK_SIZE; index++) {
      if (job.error_height === null) {
        updatedJob = await functions[job.function_name](updatedJob || job);
        await knex('job')
          .where('id', updatedJob.id)
          .update({
            height: updatedJob.height,
            error_height: updatedJob.error_height, 
            error_message: updatedJob.error_message, 
          });
        jobs[index] = updatedJob;
      }
    }
  });
}
