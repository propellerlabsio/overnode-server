import os from 'os';
import { request as rpc } from '../rpc';
import { knex } from '../knex';
import { status } from '../main';

const maxResults = 100;

// The root provides a resolver function for each API endpoint
const resolvers = {
  Query: {
    block: (parent, { hash, height }) => rpc('getblock', hash || height.toString()),
    blocks(root, args) {
      // Allow querying from height 0 (first block) even though in JavaScript zero is "falsey"
      let { fromHeight } = args;
      if (fromHeight !== 0 && !fromHeight) {
        fromHeight = status.height.overnode;
      }

      // Limit rows to be returned
      const limit = args.limit || 15;
      if (limit > maxResults) {
        throw new Error(`Please limit your query to ${maxResults} results.`);
      }

      // Return query promise
      return knex('block')
        .where('height', '<=', fromHeight)
        .orderBy('height', 'desc')
        .limit(limit);
    },
    host: () => ({
      hostname: os.hostname(),
      platform: os.platform(),
      cpus: os.cpus(),
      totalmem: os.totalmem(),
    }),
    jobs: (root, args) => {
      let query = knex('job').select();
      if (args.onlyJobsInError) {
        query = query.whereNotNull('error_message');
      }
      return query;
    },
    node: () => rpc('getinfo'),
    peers: () => rpc('getpeerinfo'),
  },
};

export default resolvers;
