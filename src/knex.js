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
