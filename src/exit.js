/* eslint-disable import/prefer-default-export */

export function setupExitHandler(fullNode) {
  // prevent process from closing instantly and not allowing us to cleanaup
  process.stdin.resume();

  const exitHandler = () => {
    if (fullNode) {
      console.log('Stopping full node...');
      const stopNode = fullNode
        .close()
        .catch((err) => {
          setImmediate(() => {
            throw err;
          });
        })
        .then(() => console.log('Full node stopped'));
      Promise.resolve(stopNode);
    }
  }

  // Handle regular exit
  process.on('exit', exitHandler);

  // Catch ctrl+c event
  process.on('SIGINT', exitHandler);

  // Catch "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler);
  process.on('SIGUSR2', exitHandler);

  // Catches uncaught exceptions
  process.on('uncaughtException', exitHandler);
}