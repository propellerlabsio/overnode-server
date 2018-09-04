/* Allow console messages from this file only */
/* eslint-disable no-console                  */

import express from 'express';
import graphqlHTTP from 'express-graphql';
import cors from 'cors';
import { makeExecutableSchema } from 'graphql-tools';
import { setupExitHandler } from './exit';

// Local imports
import typeDefs from './graphql/typedefs';
import resolvers from './graphql/resolvers';
import socket from './io/socket';
import FullNode from './io/FullNode';

let fullNode;

// import * as rpc from './io/rpc';
// import { start as startMain } from './main';

const main = async () => {
  // Start bitcoin node
  const peers = process.env.PEERS ? process.env.PEERS.split(',') : null;
  fullNode = new FullNode(
    process.env.NETWORK,
    process.env.DATA_DIR,
    process.env.MAX_OUTBOUND,
    peers,
  );
  await fullNode.start();
  setupExitHandler(fullNode);
  console.log(`Running a bitcon full node connected to '${process.env.NETWORK}' network`);

  let app;

  // Set up tasks, errors here should be fatal and stop server
  try {
    // Initialize and test rpc connection
    // await rpc.initialize();

    // Create express
    app = express();

    // Serve static/public files from dist/public.  This is the folder
    // where the build output of the overnode client should be copied
    // to on the production server
    app.use(express.static('dist/public'));

    // TODO investigate/fix/remove this in production!
    app.use(cors());

    // Prevent attackers knowing we're running express
    // Recommended by expressjs.com
    app.disable('x-powered-by');

    // Create Graphql schema from type defs and resolvers
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    });

    // Graphql server
    app.use('/graphql', graphqlHTTP({
      schema,
      graphiql: (process.env.GRAPHIQL === 'on'),
    }));

    // Start listening for requests
    const htmlPort = process.env.PORT || 4000;
    const expressServer = app.listen(htmlPort);
    console.log(`Running a http server at localhost:${htmlPort}`);
    console.log(`Running a GraphQL API server at localhost:${htmlPort}/graphql`);

    // Start websockets server for handling live data feeds
    socket(expressServer);
  } catch (err) {
    // Treat errors in any of these start up tasks as fatal
    console.error(err);
    process.exit(1);
  }

  // Regular ongoing processing tasks
  try {
    // Start main management process for continually monitoring bitcoind,
    // compiling and broadcasting statistics over the websocket
    // startMain();
  } catch (err) {
    // Misc error during regular processing. Log and play on
    console.error(err);
  }
};

console.log(`Nodejs running in ${process.env.NODE_ENV} mode`);
main();
