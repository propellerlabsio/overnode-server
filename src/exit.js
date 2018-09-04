/* eslint-disable import/prefer-default-export */
/* eslint-disable no-console */
import nodeCleanup from 'node-cleanup';

export function setupExitHandler(fullNode) {
  nodeCleanup((exitCode, signal) => {
    if (signal) {
      console.log('Stopping full node...');
      fullNode
        .close()
        .catch((err) => {
          setImmediate(() => {
            throw err;
          });
        })
        .then(() => {
          console.log('Full node stopped');
          process.kill(process.pid, signal);
        });
      nodeCleanup.uninstall(); // don't call cleanup handler again
      return false;
    }
    return true;
  });
}
