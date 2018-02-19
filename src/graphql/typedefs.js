// Construct a schema, using GraphQL schema language

// TODO Several fields are using type Float because of GraphQL's lack
// of a native BigInt scalar type.  We should import a BigInt
// implementation or roll our own.  Examples include:
// Block.nonce, Host.totalmem, Peer.bytessent and bytesrecv.
const typeDefs = `
    type Block {
      hash: String!
      confirmations: Int!
      size: Int!
      height: Int!
      version: Int!
      versionHex: String!
      merkleroot: String!
      transactions(fromIndex: Int = 0, limit: Int): [Transaction]
      time: Int!
      mediantime: Int!
      nonce: Float!
      bits: String!
      interval: Int!
      tx_count: Int!
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

    type Job {
      id: Int!
      function_name: String!
      height: Int
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

        blocks(fromHeight: Int, limit: Int): [BlockSummary],

        host: Host!

        node: Node!

        jobs(onlyJobsInError: Boolean): [Job]

        peer(id: Int!): Peer

        peers: [Peer]

        transaction(txid: String!): Transaction
    }

    # A single bitcoin transaction.
    # Note:
    # Transaction Block has been temporarily removed to prevent recursive Block->Transaction->Block
    # queries which could heavily impact the server.  It will be reinstated when we have a way 
    # to introduce query costing and prevent malicious queries being executed by the public.
    # In the meantime, please query the block directly using the block hash provided.
    type Transaction {
      txid: String!
      size: Int!
      blockhash: String
      confirmations: Int
      time: Int!
      inputs: [TransactionInput]
      outputs: [TransactionOutput]
    }

    type TransactionInput {
      coinbase: String
      txid: String
      output_number: Int
    }

    type TransactionOutput {
      number: Int
      value: Float
      addresses: [String]
    }
`;

export default typeDefs;
