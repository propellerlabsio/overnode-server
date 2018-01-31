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
import { resetJobErrors, collate } from './collate';
import * as socket from './socket';

console.log(`Node running in ${process.env.NODE_ENV} mode`);

// Perform any outstanding knex migrations
knex
  .migrate
  .latest()
  .then(async () => {
    console.log('Migration(s) finished - if any');

    // Create express
    const app = express();

    // TODO investigate/fix/remove this in production!
    app.use(cors());

    // Prevent attackers knowing we're running express
    // Recommended by expressjs.com
    app.disable('x-powered-by');

    // Serve website and static files from /static
    app.use(express.static('static'));

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
    app.listen(4000);
    console.log('Running a GraphQL API server at localhost:4000/graphql');


    // Reset any job errors and then kick off collate job(s)
    await resetJobErrors();
    collate();

    // Start websockets server for handling live data feeds
    socket.start(app);
    socket.broadcast();
  })
  .catch((err) => {
    console.error(err);
  });
