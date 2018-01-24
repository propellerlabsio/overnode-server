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

// const { hotlinkPrevention } = require('./api/hotlinkPrevention');


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

    // Prevent hotlinking of images / bandwidth sucking
    // app.use('/logos', hotlinkPrevention);

    // Prevent attackers knowing we're running express
    // Recommended by expressjs.com
    app.disable('x-powered-by');

    // Static files
    // TODO prevent leeching
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

    // TODO Kick off database update job
  })
  .catch((err) => {
    console.error(err);
  });
