import rpc from '../rpc';

// The root provides a resolver function for each API endpoint
const resolvers = {
  Query: {
    rpc_getinfo: () => rpc('getinfo'),
    rpc_getblock: (parent, { hash }) => rpc('getblock', [hash]),
  },
};

export default resolvers;
