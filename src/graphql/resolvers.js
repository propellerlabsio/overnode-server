import addresses from '../api/addresses';
import blocks from '../api/blocks';
import host from '../api/host';
import inputs from '../api/inputs';
import sync from '../api/sync';
import limits from '../api/limits';
import node from '../api/node';
import outputs from '../api/outputs';
import peers from '../api/peers';
import search from '../api/search';
import transactions from '../api/transactions';
import users from '../api/users';

function pagedQuery(apiFunction, args) {
  const paging = args.paging || { paging: { offset: null, limit: null } };

  // Validate limit
  const validatedLimit = limits.validate({
    requested: paging.limit,
  });

  // Offset needed but not required of user
  const validatedOffset = paging.offset ?
    paging.offset :
    0;

  // Call requested API function
  const validatedArgs = Object.assign(args, {
    paging: {
      offset: validatedOffset,
      limit: validatedLimit,
    },
  });
  return apiFunction(validatedArgs);
}

const resolvers = {
  Address: {
    transactions: ({ address }, args) => pagedQuery(transactions.findByAddress, {
      address,
      paging: args.paging,
    }),
  },
  Block: {
    transactions: (block, args) => pagedQuery(transactions.findByBlock, {
      block,
      paging: args.paging,
    }),
  },
  Mutation: {
    createUser: (root, args) => users.create(args),
    requestToken: (root, args) => users.getToken(args),
  },
  Peer: {
    location: peer => peers.location(peer),
  },
  Query: {
    block: (root, args) => blocks.get(args),
    blocks: (root, args) => pagedQuery(blocks.find, args),
    host: (root, args) => host.get(args),
    node: (root, args) => node.get(args),
    peer: (root, args) => peers.get(args),
    peers: (root, args) => peers.find(args),
    transaction: (root, args) => transactions.get(args),
    search: (root, args) => search.simple(args),
    sync: (root, args) => sync.find(args),
    sync_error: (root, args) => pagedQuery(sync.findError, args),
  },
  Transaction: {
    inputs: (transaction, args) => pagedQuery(inputs.find, Object.assign(args, transaction)),
    outputs: (transaction, args) => pagedQuery(outputs.find, Object.assign(args, transaction)),
  },
  TransactionOutput: {
    addresses: output => addresses.findByOutput(output),
  },
};

export default resolvers;
