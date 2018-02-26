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
  find: async ({ fromHeight, limit }) =>
    // Return query promise
    knex('block')
      .where('height', '<=', fromHeight || liveData.broadcast.height.overnode.to)
      .orderBy('height', 'desc')
      .limit(limit),
};

export default blocks;
