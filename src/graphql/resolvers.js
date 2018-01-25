import rpc from '../rpc';

// The root provides a resolver function for each API endpoint
const resolvers = {
  Query: {
    rpc_info: () => rpc('getinfo'),
  },
};

export default resolvers;
