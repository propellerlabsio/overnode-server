// TODO Credit CryptoCompare with rate data in client

import axios from 'axios';
import { knex } from '../io/knex';

const currencies = {
  find: () =>
    knex('currency').orderBy('code'),
  async update() {
    // Get prices from CryptoCompare (don't call too frequently)
    const ccRequest = await axios.get('https://min-api.cryptocompare.com/data/price?fsym=BCH&tsyms=USD,BTC,EUR,JPY');
    if (ccRequest.status === 200) {
      const lastUpdated = Math.floor(Date.now() / 1000);
      await Promise.all(Object.entries(ccRequest.data).map(([key, value]) =>
        knex('currency').where('code', key).update({ bch_rate: value, rate_updated: lastUpdated })));
    } else {
      throw new Error(`Unable to upate prices from CryptoCompare.  Status === ${ccRequest.status}`);
    }
  },
};

export default currencies;
