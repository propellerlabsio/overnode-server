// Construct a schema, using GraphQL schema language

// TODO Several fields are using type Float because of GraphQL's lack
// of a native BigInt scalar type.  We should import a BigInt
// implementation or roll our own.  Examples include:
// Block.nonce, Host.totalmem, Peer.bytessent and bytesrecv.
const typeDefs = `
    type Block {
      hash: String!
      size: Int!
      height: Int!
      time: Int!
      tx_count: Int!
      interval: Int!
      transactions(fromIndex: Int = 0, limit: Int): [Transaction]
    }

    type CPU {
      model: String!
      speed: Int!
    }

    type Host {
      hostname: String!
      platform: String!
      cpus: [CPU]
      totalmem: Float!
      donation_address: String
      overnode_version: String!
    }

    type Node {
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

    type SyncJob {
      name: String!
      from_height: Int
      to_height: Int
      error_height: Int
      error_message: String
    }

    type Location {
      address: String
      country: String
      country_code: String
      region: String
      region_name: String
      city: String
      zip: String
      lat: Float
      lon: Float
      proxy: Boolean
      timezone: String
      isp: String
      org: String
      as: String
    }

    type Peer {
      id: Int!
      addr: String!
      addrlocal: String
      services: String!
      relaytxes: Boolean!
      lastsend: Int!
      lastrecv: Int!
      bytessent: Float!
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
      location_fetched: String
      location: Location
    }

    type Query {
        block(hash: String, height: Int): Block!

        blocks(fromHeight: Int, limit: Int): [Block],

        host: Host!

        node: Node!

        sync(onlyJobsInError: Boolean): [SyncJob]

        peer(id: Int!): Peer

        peers: [Peer]

        transaction(transaction_id: String!): Transaction
    }

    # A single bitcoin transaction.
    type Transaction {
      transaction_id: String!
      transaction_index: Int!
      size: Int!
      block_hash: String
      time: Int!
      input_count: Int!
      output_count: Int!
      inputs(fromIndex: Int = 0, limit: Int): [TransactionInput]
      outputs(fromIndex: Int = 0, limit: Int): [TransactionOutput]
    }

    type TransactionInput {
      transaction_id: String!
      input_index: Int!
      block_hash: String
      coinbase: String
      output_transaction_id: String
      output_index: Int
    }

    type TransactionOutput {
      transaction_id: String!
      output_index: Int
      value: Float
      addresses: [String]
    }
`;

export default typeDefs;
