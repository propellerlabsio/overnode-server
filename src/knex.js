/* Allow console commands.  Code in this file is run once on server startup   */
/* and it is useful to quickly identify that the connection has been made.    */
/* eslint-disable no-console                                                  */

// Create knex instance for interacting with postgres database
console.log('Connecting to: ', process.env.PG_CONNECTION_STRING);
const knex = require('knex')({
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
  searchPath: 'public',
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
  },
});

module.exports.knex = knex;
