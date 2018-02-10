import os from 'os';
import { request as rpc } from '../rpc';
import { knex } from '../knex';
import { status } from '../main';

const maxResults = 100;

// The root provides a resolver function for each API endpoint
const resolvers = {
  Block: {
    // eslint-disable-next-line arrow-body-style
    nextblock: (block) => {
      return block.nextblockhash ?
        resolvers.Query.block(block, { hash: block.nextblockhash }) :
        null;
    },
    // eslint-disable-next-line arrow-body-style
    previousblock: (block) => {
      return block.previousblockhash ?
        resolvers.Query.block(block, { hash: block.previousblockhash }) :
        null;
    },
    summary(block) {
      return knex('block').where('hash', block.hash);
    },
    async transactions(block) {
      // May be hundreds (or more) transactions so can't fetch asyncronously or bitcoind throws
      // error "Work queue depth exceeded".  We could increase the limit that bitcoind will
      // accept by setting option rpcworkqueue=<n> to a higher number than the default
      // (16?) but not sure what the ceiling or limit is so process synchronously instead.
      // This data will be moved to database soon(™)
      const transactions = [];

      // eslint-disable-next-line no-restricted-syntax
      for (const txid of block.tx) {
        // eslint-disable-next-line no-await-in-loop
        const transaction = await resolvers.Query.transaction({}, { txid });
        transactions.push(transaction);
      }

      return transactions;
    },
  },
  BlockSummary: {
    details: blockSummary =>
      resolvers.Query.block(blockSummary, { hash: blockSummary.hash }),
  },
  Query: {
    block: (parent, { hash, height }) => rpc('getblock', hash || height.toString()),
    blocks(root, args) {
      // Allow querying from height 0 (first block) even though in JavaScript zero is "falsey"
      let { fromHeight } = args;
      if (fromHeight !== 0 && !fromHeight) {
        fromHeight = status.stats.height.overnode;
      }

      // Limit rows to be returned
      const limit = args.limit || 15;
      if (limit > maxResults) {
        throw new Error(`Please limit your query to ${maxResults} results.`);
      }

      // Return query promise
      return knex('block')
        .where('height', '<=', fromHeight)
        .orderBy('height', 'desc')
        .limit(limit);
    },
    host: () => ({
      hostname: os.hostname(),
      platform: os.platform(),
      cpus: os.cpus(),
      totalmem: os.totalmem(),
    }),
    jobs: (root, args) => {
      let query = knex('job').select();
      if (args.onlyJobsInError) {
        query = query.whereNotNull('error_message');
      }
      return query;
    },
    node: () => status.rpc.info,
    peers: () => status.rpc.peers,
    transaction: async (root, args) => {
      const rawTx = await rpc('getrawtransaction', args.txid, 1);
      return {
        txid: rawTx.txid,
        size: rawTx.size,
        blockhash: rawTx.blockhash,
        confirmations: rawTx.confirmations,
        time: rawTx.time,
        inputs: rawTx.vin.map(input => ({
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
};

export default resolvers;
