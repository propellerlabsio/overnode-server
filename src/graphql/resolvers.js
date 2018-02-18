import { request as rpc } from '../rpc';
import { knex } from '../knex';
import { liveData } from '../main';
import blocks from '../api/blocks';
import host from '../api/host';
import node from '../api/node';
import peers from '../api/peers';

const defaultResultCount = 15;
const maxResultCount = 50;

const resolvers = {
  Block: {
    summary: ({ hash }) => blocks.summary.get({ hash }),
    async transactions(block, args) {
      const transactions = [];
      if (block.height === 0) {
        // bitcoind rpc method getrawtransaction doesn't work for this block
        // TODO: Find alternative
      } else {
        // Limit rows to be returned
        const limit = args.limit || defaultResultCount;
        if (limit > maxResultCount) {
          throw new Error(`Please limit transactions to no more than ${maxResultCount} results.`);
        }

        // Get range of tx ids to be returned
        const txIds = block.tx.slice(args.fromIndex, args.fromIndex + limit);

        // Fetch transactions synchronously.  Async would require that we
        // increase the limit that bitcoind will accept by setting option rpcworkqueue=<n>
        // to a higher number than the default (16?) but obviously there's a ceiling
        // to how far we can keepd doing that.
        // This data will be moved to database soon(™)
        // eslint-disable-next-line no-restricted-syntax
        for (const txid of txIds) {
          // eslint-disable-next-line no-await-in-loop
          const transaction = await resolvers.Query.transaction({}, { txid });
          transactions.push(transaction);
        }
      }

      return transactions;
    },
  },
  BlockSummary: {
    details: ({ hash }) => blocks.detail.get({ hash }),
  },
  Peer: {
    location: peers.location,
  },
  Query: {
    block: (root, args) => blocks.detail.get(args),
    blocks: (root, args) => blocks.summary.find(args),
    host: () => host.get(),
    jobs: (root, args) => {
      let query = knex('job').select();
      if (args.onlyJobsInError) {
        query = query.whereNotNull('error_message');
      }
      return query;
    },
    node: node.get,
    peer: (root, args) => peers.get(args),
    peers: (root, args) => peers.find(args),
    transaction: async (root, args) => {
      const rawTx = await rpc('getrawtransaction', args.txid, 1);
      return {
        txid: rawTx.txid,
        size: rawTx.size,
        blockhash: rawTx.blockhash,
        confirmations: rawTx.confirmations,
        time: rawTx.time,
        inputs: rawTx.vin.map(input => ({
          coinbase: input.coinbase,
          txid: input.txid,
          output_number: input.vout,
        })),
        outputs: rawTx.vout.map(output => ({
          number: output.n,
          addresses: output.scriptPubKey.addresses,
          value: output.value,
        })),
      };
    },
  },
  // Transaction Block has been temporarily removed to prevent recursive Block->Transaction->Block
  // queries which could heavily impact the server.  It will be reinstated when we have a way
  // to introduce query costing and prevent malicious queries being executed by the public.
  // Transaction: {
  // block: transaction => resolvers.Query.block(transaction, { hash: transaction.blockhash }),
  // },
};

export default resolvers;
