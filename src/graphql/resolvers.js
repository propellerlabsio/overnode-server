// The root provides a resolver function for each API endpoint
const resolvers = {
  Query: {
    status: async () => {
      return {
        node_status: 'Fine',
      };
    },
  },
};

export default resolvers;
