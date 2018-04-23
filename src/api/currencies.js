/* Ignore camel case requirement since many of the variables and arguments    */
/* passed through unmodified from graphql queries where the sources are       */
/* postgresql where camelcase names are not supported.                        */
/* eslint-disable camelcase                                                   */

import axios from 'axios';
import { knex } from '../knex';

const currencies = {
  find: () =>
    knex('currency').orderBy('code'),
  async update() {
    // Get prices from CoinMarketCap (don't call more than once every
    // five minutes since they don't update more frequently)
    const cmcRequest = await axios.get('https://api.coinmarketcap.com/v1/ticker/bitcoin-cash/');
    if (cmcRequest.status === 200) {
      const [{ price_btc, price_usd, last_updated }] = cmcRequest.data;
      await Promise.all([
        knex('currency').where('code', 'BTC').update({ bch_rate: price_btc, rate_updated: last_updated }),
        knex('currency').where('code', 'USD').update({ bch_rate: price_usd, rate_updated: last_updated }),
      ]);
    } else {
      throw new Error(`Unable to upate prices from CMC.  Status === ${cmcRequest.status}`);
    }
  },
};

export default currencies;
