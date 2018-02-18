import { knex } from '../knex';
import { liveData } from '../main';

const peers = {
  get: ({ id }) => liveData.rpc.peers.find(peer => peer.id === id),
  find: () => liveData.rpc.peers,
  location: async ({ addr }) => {
    const [location] = await knex('peer').where('address', addr);
    return location;
  },
};

export default peers;
