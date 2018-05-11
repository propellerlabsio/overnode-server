import { db } from '../io/db';
// import { liveData } from '../main';

const collection = db.collection('blocks');

const blocks = {
  get: async (hashOrHeight) => {
    const cursor = await collection.byExample(hashOrHeight, { limit: 1 });
    return cursor.next();
  },
  // TODO convert to arangodb
  // find: async ({ paging }) => {
  //   // Return query promise
  //   const fromHeight = liveData.broadcast.height.overnode.to - paging.offset;
  //   return knex('block')
  //     .where('height', '<=', fromHeight)
  //     .orderBy('height', 'desc')
  //     .limit(paging.limit);
  // },
};

export default blocks;
