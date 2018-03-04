import { knex } from '../knex';
import { liveData } from '../main';

const peers = {
  get: ({ id }) => liveData.rpc.peers.find(peer => peer.id === id),
  find: () => liveData.rpc.peers,
  location: async ({ addr }) => {
    const ipAddress = addr.split(':')[0];
    const [location] = await knex('geolocation').where('ip_address', ipAddress);
    return location;
  },
};

export default peers;
