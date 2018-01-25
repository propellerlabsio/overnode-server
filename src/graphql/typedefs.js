// Construct a schema, using GraphQL schema language
const typeDefs = `
    type RpcInfo {
      balance: Int!
      blocks: Int!
      connections: Int!
      difficulty: Float!
      errors: String!
      fork: String!
      keypoololdest: Int!
      keypoolsize: Int!
      paytxfee:  Int!
      protocolversion: Int!
      proxy: String!
      relayfee: Float!
      status: String!
      testnet: Boolean!
      timeoffset: Int!
      unlocked_until: Int!
      version: Int!
      walletversion: Int!      
    }
    type Query {
        # Get raw node info via JSON-RPC call to getinfo
        rpc_info: RpcInfo!
    }
`;

export default typeDefs;
