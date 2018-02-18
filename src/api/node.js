import { liveData } from '../main';

const host = {
  get: () => liveData.rpc.info,
};

export default host;
