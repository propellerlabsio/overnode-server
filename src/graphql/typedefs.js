// Construct a schema, using GraphQL schema language

// TODO Several fields are using type Float because of GraphQL's lack
// of a native BigInt scalar type.  We should import a BigInt
// implementation or roll our own.  Examples include:
// Block.nonce, Host.totalmem, Peer.bytessent and bytesrecv.
const typeDefs = `
    type Address {
      address: String!
      totals: AddressTotals!
      received(paging: Paging): [TransactionOutput]
      spent(paging: Paging): [TransactionInput]
    }

    type AddressTotals {
      spent: Float!
      received: Float!
    }

    type Block {
      hash: String!
      size: Int!
      height: Int!
      time: Int!
      tx_count: Int!
      interval: Int!
      transactions(paging: Paging): [Transaction]
    }

    type CPU {
      model: String!
      speed: Int!
    }

    type Currency {
      code: String!
      label: String!
      bch_rate: Float!
      decimal_places: Int!
      rate_updated: Float!
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
      fork: String
      keypoololdest: Int!
      keypoolsize: Int!
      paytxfee:  Int!
      protocolversion: Int!
      proxy: String!
      relayfee: Float!
      status: String
      testnet: Boolean!
      timeoffset: Int!
      unlocked_until: Int!
      version: Int!
      walletversion: Int!      
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

    input Paging {
      limit: Int
      offset: Int
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
      pingtime: Float
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
        address(address: String!): Address

        block(hash: String, height: Int): Block!

        blocks(paging: Paging): [Block]

        currencies(paging: Paging): [Currency]

        host: Host!

        node: Node!

        # Admin function: raw access to bitcoind transaction via JSON-RPC.
        rpc: Rpc

        sync: [SyncJob]

        sync_error(paging: Paging): [SyncError]

        peer(id: Int!): Peer

        peers: [Peer]

        transaction(transaction_id: String!): Transaction

        search(term: String!): SearchResult
    }
     
    # Direct access to bitcoind via JSON-RPC interface.  Admin function only.
    type Rpc {
      authorized: Boolean!

      # Mine up to nblocks blocks immediately (before the RPC call returns) to an address in the wallet.
      generate(nblocks: Int! = 1, maxtries: Int): String

      # Returns an object containing various state info.
      getinfo: String

      # Return the raw transaction data.      
      getrawtransaction(txid: String!,  verbose: Int): String
    }

    type SearchResult {
      block: Block
      transaction: Transaction
      address: Address
    }

    type SyncJob {
      name: String!
      from_height: Int
      to_height: Int
    }

    type SyncError {
      height: Int!
      name: String!
      message: String
    }

    # A single bitcoin transaction.
    type Transaction {
      transaction_id: String!
      transaction_number: Int!
      size: Int!
      block_height: Int
      time: Int!
      input_count: Int!
      output_count: Int!
      inputs(paging: Paging): [TransactionInput]
      outputs(paging: Paging): [TransactionOutput]
    }

    type TransactionInput {
      transaction_id: String!
      input_number: Int!
      coinbase: String
      output_transaction_id: String
      output_number: Int
      output_value: Float
    }

    type TransactionOutput {
      transaction_id: String!
      output_number: Int
      value: Float
      address: String
      addresses: [String]
    }

    type Mutation {
      # Create a new user account
      createUser(email: String!, password: String!): Boolean!

      # Request an access token for a given email / password
      requestToken(email: String!, password: String!, permanent: Boolean = false): String    
    }
`;

export default typeDefs;
