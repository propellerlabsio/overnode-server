import { knex } from '../knex';
import { liveData } from '../main';

const blocks = {
  // detail: {
  //   get: async ({ hash, height }) => {
  //     // Get block data from database and bitcoin daemon asyncronously
  //     // but wait until we have both bits of data before proceeding
  //     const [blockRpc, blockDb] = await Promise.all([
  //       rpc('getblock', hash || height.toString()),
  //       blocks.summary.get({ hash, height }),
  //     ]);

  //     // Return merged fields from bitcoin daemon and database
  //     return Object.assign(blockRpc, blockDb);
  //   },
  // },
  // summary: {
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
      .where('height', '<=', fromHeight || liveData.broadcast.height.overnode)
      .orderBy('height', 'desc')
      .limit(limit)
  ,
  // },
};

export default blocks;
