import { request as rpc } from '../rpc';
import { knex } from '../knex';

// The root provides a resolver function for each API endpoint
const resolvers = {
  Query: {
    peers: () => rpc('getpeerinfo'),
    blocks() {
      return knex('block')
        .orderBy('height', 'desc')
        .limit(15);
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
