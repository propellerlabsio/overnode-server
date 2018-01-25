// Construct a schema, using GraphQL schema language
const typeDefs = `
    type RpcBlock {
      hash: String!
      confirmations: Int!
      size: Int!
      height: Int!
      version: Int!
      versionHex: String!
      merkleroot: String!
      tx: [String]
      time: Int!
      mediantime: Int!
      nonce: Int!
      bits: String!
      difficulty: Float!
      chainwork: String!
      previousblockhash: String!
      nextblockhash: String!
    }

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
        rpc_getinfo: RpcInfo!

        rpc_getblock(hash: String!): RpcBlock!
    }
`;

export default typeDefs;
