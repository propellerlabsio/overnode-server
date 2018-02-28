import { knex } from '../knex';
import { liveData } from '../main';

const blocks = {
  get: async ({ hash, height }) => {
    const indexField = hash ? 'hash' : 'height';
    const indexValue = hash || height;
    const [summary] = await knex('block')
      .where(indexField, indexValue);
    return summary;
  },
  find: async ({ paging }) => {
    // Return query promise
    const fromHeight = liveData.broadcast.height.overnode.to - paging.offset;
    return knex('block')
      .where('height', '<=', fromHeight)
      .orderBy('height', 'desc')
      .limit(paging.limit);
  },
};

export default blocks;
