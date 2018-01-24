/**
 * This file is used exclusively by the knex cli tool and is only necessary
 * for that purpose.  Our migrations performed automatically in index.js
 * so this file is not used except when creating new migrations or rolling back
 * migrations via the command line, e.g. the following commands:
 * 
 *   `knex migrate:make <name>`
 *   `knex migrate:rollback` 
 *   etc
 */
// Load local environment variables first
require('dotenv').config();

// Update with your config settings.
module.exports = {

  development: {
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING,
    searchPath: 'knex,public',
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations'
    },
  },

  staging: {
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING,
    searchPath: 'knex,public',
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations'
    },
  },

  production: {
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING,
    searchPath: 'knex,public',
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations'
    },
  },
};
