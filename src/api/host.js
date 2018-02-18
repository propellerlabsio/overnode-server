import os from 'os';

const host = {
  get: () => ({
    hostname: os.hostname(),
    platform: os.platform(),
    cpus: os.cpus(),
    totalmem: os.totalmem(),
    donation_address: process.env.DONATION_ADDRESS,
  }),
};

export default host;
