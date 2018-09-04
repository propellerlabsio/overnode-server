import bcoin from 'bcash';

let node;

class FullNode extends bcoin.FullNode {
  constructor(network, dataDirectory, maxOutbound, peers) {
    super({
      network,
      prefix: dataDirectory,
      memory: false,
      workers: true,
      prune: false,
      checkpoints: true,
      coinCache: 1000,
      indexTx: true,
      indexAddress: true,
      persistentMempool: true,
      maxOutbound,
      peers,
    });

    this.on('connect', this.onConnect);
    this.on('tx', this.onTransaction);
  }

  // eslint-disable-next-line class-methods-use-this
  onConnect(entry, block) {
    // eslint-disable-next-line no-console
    console.log('%s (%d) added to chain.', entry.rhash(), entry.height);
  }

  onTransaction(tx) {
    // eslint-disable-next-line no-console
    console.log(this);
    // eslint-disable-next-line no-console
    console.log('%s added to mempool....', tx.txid());
  }

  async start() {
    await this.open();
    await this.connect();
    this.startSync();
  }
}

export const create = (network, dataDirectory, maxOutbound, peers) => {
  if (node) {
    throw new Error('Full node already instantiated');
  } else {
    node = new FullNode(network, dataDirectory, maxOutbound, peers);
  }
  return node;
};

export const get = () => node;
