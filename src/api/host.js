import os from 'os';

const packageJson = require('../../package.json');

const host = {
  get: () => ({
    hostname: os.hostname(),
    platform: os.platform(),
    cpus: os.cpus(),
    totalmem: os.totalmem(),
    donation_address: process.env.DONATION_ADDRESS,
    overnode_version: packageJson.version,
  }),
};

export default host;
