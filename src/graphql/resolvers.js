import rpc from '../rpc';
import { knex } from '../knex';

// The root provides a resolver function for each API endpoint
const resolvers = {
  Query: {
    blocks() {
      return knex('block')
        .orderBy('height', 'desc')
        .limit(15);
    },
    rpc_getinfo: () => rpc('getinfo'),
    rpc_getblock: (parent, { hash }) => rpc('getblock', hash),
  },
};

export default resolvers;
