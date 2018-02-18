import { request as rpc } from '../rpc';
import { knex } from '../knex';
import { liveData } from '../main';
import limits from './limits';

const blocks = {
  detail: {
    get: async ({ hash, height }) => rpc('getblock', hash || height.toString()),
  },
  summary: {
    get: async ({ hash, height }) => {
      const indexField = hash ? 'hash' : 'height';
      const indexValue = hash || height;
      const [summary] = await knex('block')
        .where(indexField, indexValue);
      return summary;
    },
    find: async ({ fromHeight, limit }) => {
      // Limit rows to be returned
      if (limit > limits.results.max) {
        throw new Error(`Please limit your query to no more than  ${limits.results.max} results.`);
      }

      // Return query promise
      return knex('block')
        .where('height', '<=', fromHeight || liveData.broadcast.height.overnode)
        .orderBy('height', 'desc')
        .limit(limit || limits.results.default);
    },
  },
};

export default blocks;
