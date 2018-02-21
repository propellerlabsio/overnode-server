/* Allow console messages from this file only */
/* eslint-disable no-console                  */
import express from 'express';
import graphqlHTTP from 'express-graphql';
import cors from 'cors';
import { makeExecutableSchema } from 'graphql-tools';

// Local imports
import { knex } from './knex';
import typeDefs from './graphql/typedefs';
import resolvers from './graphql/resolvers';
import jobs from './api/jobs';
import socket from './socket';
import * as rpc from './rpc';
import { start as startMain } from './main';

console.log(`Node running in ${process.env.NODE_ENV} mode`);

// Perform any outstanding knex migrations
knex
  .migrate
  .latest()
  .then(async () => {
    console.log('Migration(s) finished - if any');

    let app;

    // Set up tasks, errors here should be fatal and stop server
    try {
      // Initialize and test rpc connection
      await rpc.initialize();

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
        context: { knex },
        graphiql: (process.env.GRAPHIQL === 'on'),
      }));
    } catch (err) {
      // Treat errors in any of these start up tasks as fatal
      console.error(err);
      process.exit(1);
    }

    // Start listening for requests
    const htmlPort = process.env.PORT || 4000;
    const expressServer = app.listen(htmlPort);
    console.log(`Running a http server at localhost:${htmlPort}`);
    console.log(`Running a GraphQL API server at localhost:${htmlPort}/graphql`);

    // Reset any job errors and then kick off collate job(s)
    await jobs.resetErrors();

    // Start websockets server for handling live data feeds
    socket(expressServer);

    // Start main management process for continually monitoring bitcoind,
    // compiling and broadcasting statistics over the websocket
    startMain();
  })
  .catch((err) => {
    // Misc error - log and play on
    console.error(err);
  });
