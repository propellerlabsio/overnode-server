// Construct a schema, using GraphQL schema language
const typeDefs = `
    type Block {
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

      # TODO add custom bigint scalar type and use that instead
      nonce: Float!

      bits: String!
      difficulty: Float!
      chainwork: String!
      previousblockhash: String
      nextblockhash: String
    }

    type BlockSummary {
      hash: String!
      size: Int!
      height: Int!
      time: Int!
      tx_count: Int!
      interval: Int!
      previousblockhash: String
      nextblockhash: String
    }

    type Info {
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

    type Peer {
      id: Int!
      addr: String!
      addrlocal: String!
      services: String!
      relaytxes: Boolean!
      lastsend: Int!
      lastrecv: Int!

      # TODO add custom bigint scalar type and use that instead
      bytessent: Float!

      # TODO add custom bigint scalar type and use that instead
      bytesrecv: Float!
      
      conntime: Int!
      timeoffset: Float!
      pingtime: Float!
      minping: Float!
      version: Int!
      subver: String!
      inbound: Boolean!
      startingheight: Int!
      banscore: Int!
      synced_headers: Int!
      synced_blocks: Int!
      whitelisted: Boolean!
    }

    type Query {
        block(hash: String!): Block!

        blocks: [BlockSummary],

        info: Info!

        peers: [Peer],
    }
`;

export default typeDefs;
