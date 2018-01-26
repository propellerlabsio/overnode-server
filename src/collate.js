import rpc from './rpc';
import { knex } from './knex';

const functions = {
  populate_block_table() {
    debugger;
  },
};

export default async function collate() {
  const { blocks } = await rpc('getinfo');
  const bestBlockHeight = blocks - 1; // TODO check if subtract 1 is necessary

  // Get collation jobs sorted by progress from lowest/earliest block height
  // Where job block height is less than current best block height
  const jobs = await knex('job')
    .select()
    .where('height', '<', bestBlockHeight)
    .orderBy('height');

  // Process jobs
  jobs.forEach((job) => {
    // Wait
    functions[job.function_name]();
  });
}
