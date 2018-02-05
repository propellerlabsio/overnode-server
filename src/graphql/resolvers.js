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
    jobs: () => knex('job').select(),
    block: (parent, { hash }) => rpc('getblock', hash),
  },
};

export default resolvers;
