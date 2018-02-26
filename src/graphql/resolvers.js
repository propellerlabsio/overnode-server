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

function limitQuery(queryName, apiFunction, args) {
  // Validate limit
  const validatedLimit = limits.validate({
    requested: args.limit,
    context: queryName,
  });

  // Call requested API function
  const validatedArgs = Object.assign(args, { limit: validatedLimit });
  return apiFunction(validatedArgs);
}

const resolvers = {
  Address: {
    transactions: ({ address }, args) => limitQuery('transactions', transactions.findByAddress, {
      address,
      fromIndex: args.fromIndex,
      limit: args.limit,
    }),
  },
  Block: {
    transactions: (block, args) => limitQuery('transactions', transactions.findByBlock, {
      block,
      fromIndex: args.fromIndex,
      limit: args.limit,
    }),
  },
  Peer: {
    location: peer => peers.location(peer),
  },
  Query: {
    block: (root, args) => blocks.get(args),
    blocks: (root, args) => limitQuery('blocks', blocks.find, args),
    host: (root, args) => host.get(args),
    sync: (root, args) => sync.find(args),
    node: (root, args) => node.get(args),
    peer: (root, args) => peers.get(args),
    peers: (root, args) => peers.find(args),
    transaction: (root, args) => transactions.get(args),
    search: (root, args) => search.simple(args),
  },
  Transaction: {
    inputs: (transaction, args) => limitQuery('inputs', inputs.find, Object.assign(args, transaction)),
    outputs: (transaction, args) => limitQuery('outputs', outputs.find, Object.assign(args, transaction)),
  },
  TransactionOutput: {
    addresses: output => addresses.findByOutput(output),
  },
};

export default resolvers;
