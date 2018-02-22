import blocks from '../api/blocks';
import host from '../api/host';
import jobs from '../api/jobs';
import node from '../api/node';
import peers from '../api/peers';
import transactions from '../api/transactions';

const resolvers = {
  Block: {
    transactions: (block, args) => transactions.forBlock({
      block,
      fromIndex: args.fromIndex,
      limit: args.limit,
    }),
  },
  Peer: {
    location: peer => peers.location(peer),
  },
  Query: {
    block: (root, args) => blocks.detail.get(args),
    blocks: (root, args) => blocks.summary.find(args),
    host: (root, args) => host.get(args),
    jobs: (root, args) => jobs.find(args),
    node: (root, args) => node.get(args),
    peer: (root, args) => peers.get(args),
    peers: (root, args) => peers.find(args),
    transaction: (root, args) => transactions.get(args),
  },
};

export default resolvers;
