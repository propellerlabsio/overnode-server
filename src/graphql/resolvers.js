import { request as rpc } from '../rpc';
import { knex } from '../knex';
import { status } from '../main';

// The root provides a resolver function for each API endpoint
const resolvers = {
  Query: {
    peers: () => rpc('getpeerinfo'),
    blocks(root, args) {
      const fromHeight = args.fromHeight || status.height.overnode;
      const limit = args.limit || 15;
      return knex('block')
        .where('height', '<=', fromHeight)
        .orderBy('height', 'desc')
        .limit(limit);
    },
    info: () => rpc('getinfo'),
    jobs: (root, args) => {
      let query = knex('job').select();
      if (args.onlyJobsInError) {
        query = query.whereNotNull('error_message');
      }
      return query;
    },
    block: (parent, { hash }) => rpc('getblock', hash),
  },
};

export default resolvers;
