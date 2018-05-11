
Overnode is a Bitcoin full node monitoring and explorer (query) tool.  This project contains the server code which prodes a GraphQL interface for interacting with the node. 

There is an example client / UI implementation written in VueJs which is hosted at [overnode.org](https://overnode.org).

**WARNING:** 

**This project is heavily under construction and in a beta state.  Some functionality is missing and there may be outstanding security flaws.  Do not run this code exposed to the internet with a bitcoin node containing a live, non-test wallet**

# Quick setup

## Prerequisites

1. You need a Bitcoin Cash node running with RPC access.  Overnode has been run with BitcoinABC and Bitcoin Unlimited Cash successfully. See [Node Settings](#node-settings) for expected node settings.

2. You need an empty / dedicated postgresql database available.

3. You need to configure your [Environment variables](#environment-variables).

## Node settings

Generally the following node settings are required or expected:

	-usecashaddr=1 (default on most node implementations)
	-server=1 (required for json-rpc)
	-txindex=1 (required to sync transactions to overnode db)

## Building and running

``` bash
# install dependencies
npm install

# build and run
npm run dev

# build for production
npm run build
```

# Deploying

Prior to deploying, on your development machine, run `npm version patch` to:

1. Increment the package version in `package.json`.
2. Commit and push the new version to Github.
3. Publish the new release.

This will allow the client to know a refresh is required.

# Contributing

TODO - complete this section.

## Style

This project is linted with eslint using the AirBnB style guide rules.

## Field naming conventions

Postgresql doesn't support camelcase field names and instead components of field names are separated by the underscore character.  In order to remove the need for extensive transalation, GraphQL queries return properties in the same format.  GraphQL types however follow normal GraphQL naming conventions.  Field names in JSON data returned by bitcoind are inconsistent from query to query and are translated to our standard on storage or presentation.

## Other
See [API Conventions](#api-conventions).

# Reference

## Environment variables
In production, set the environment variables per your normal procedure for your operating system giving consideration to best security practices.

In local development, you can create a file in the application root directory called `.env` (nothing in the name before the period) and populate it with appropriate values.

The following is an example of the `.env` file contents:
```
BITCOIN_COOKIE_DIRECTORY=/home/user/.bitcoin/
DB_NAME=overnode
DB_USER=overnode
DB_PASSWORD=overnode
NODE_ENV=development
GRAPHIQL=on
PORT=4000
DONATION_ADDRESS=bitcoincash:qqtfhm837rqfteckfm5khxj69y8yyscywc6g4e70em
```

### BITCOIN_RPC_AUTH

The `user:password` for connecting to the bitcoin node via JSON-RPC.  If this environment variable is not provided, it is necessary that the BITCOIN_COOKIE_DIRECTORY variable be set.

### BITCOIN_COOKIE_DIRECTORY

If no BITCOIN_RPC_AUTH is provided, this folder is read for a file called `.cookie` which is recreated on restart of the `bitcoind` daemon and contains the RPC credentials that can be used to log in.  **NOTE:** When connecting your node to `testnet` using BU Cash, the `.cookie` file will be placed in a subdirectory of your datadirectory - e.g. `/testnet3`.  The full path to the cookie must be included in this variable value.

### DB_NAME

ArangoDB database name.

### DB_USER

ArangoDB user name.

### DB_PASSWORD

ArangoDB user password.


### BITCOIN_RPC_HOST
If not nominated, defaults to localhost '127.0.0.1'.

### BITCOIN_RPC_PORT
If not nominated, defaults to 8332. Note that for testnet and regtest, the Bitcoin Unlimited Cash node software will default the RPC port to 18332.  If there are any doubts, configure the bitcoin node to start with a specific port using the `-rpcport=<port>` argument.

### NODE_ENV

Set to `development` or `production` [as appropriate](http://expressjs.com/en/advanced/best-practice-performance.html#set-nodeenv-to-production).

### GRAPHIQL

Set to `on` to make GraphiQL (A graphical interactive in-browser GraphQL IDE) available at the same end point as GraqphQL).  Leave off in production unless you've got CPU/Bandwidth to share in spades.

### DONATION_ADDRESS

If you would like to receive donations for hosting this service, put your Bitcoin address here.

### JWT_SIGNING_KEY

A random secret used to sign JSON Web Tokens.

### HASH_PASSWORD_ITERATIONS

Number of iterations to use when hashing a password before storing it in the database.  Higher numbers are more secure but take longer and consume more CPU.

### NO_PRIORITY_SYNCING

Mostly a developer option, if set to 'yes' then priority syncing will be disabled.  Priority syncing mode is entered when the server discovers that the overnode database is more than an hour or so behind the bitcoin blockchain.  In this mode, changes to live update / broadcast data are suspended while overnode catches up.

## API conventions

### Generic methods

| Method | Purpose |
| ------ | --------|
| get    | Returns exactly one record identified by one or another unique identifiers as an object (promise). |
| find   | Returns 0 to many records indentified by various criteria as an array (promise). |

### Parameters

All methods should take an object as the first argument and destructure the parameters of interest, e.g:
```js
  get: async ({ hash, height }) => {
  },
  find: async ({ paging }) => {
  }
```

This is to allow us to pass through requests from GraphQL with a minimal amount of argument transformation boilerplate.

### Paging

Any api method that returns multiple records should implement paging and in a standardized way.  Each of these methods should take an additional object parameter named `paging` with integer parameters named `limit` and `offset`.  


To make paging reliable for the user, it is presumed that the results returned from these methods should be sorted (e.g. via knex `.orderBy()`).

#### **IMPORTANT NOTE** on paging performance

Although the `offset` parameter could sometimes be passed unmodified to the knex query builder using the `.offset()` method, this often has severe performance implications.  For example, take the following example queries in which we want the first 10 blocks going back 400,000 blocks from the current block height.  In example A, no index is used and instead postgres must execute the query and discard four hundred thousand results before it will return the rows of interest.  In the second example, postgres will go immediately to the rows of interest since `height` is indexed.  The second example runs much, much faster than the first.

##### Example A - Using `.offset()` (very, very slow)

```js
  async function find ({ paging }) => {
    return knex('block')
      .orderBy('height', 'desc')
      .limit(paging.limit)
      .offset(paging.offset);
  }

  const results = await find({ paging: { offset: 400000, limit: 10 }});
```

##### Example B - Using comparison on field that is indexed (fast)

```js
  async function find ({ paging }) => {
    const fromHeight = liveData.broadcast.height.overnode.to - paging.offset;
    return knex('block')
      .where('height', '<=', fromHeight)
      .orderBy('height', 'desc')
      .limit(paging.limit);
  }

  const results = await find({ paging: { offset: 400000, limit: 10 }});
```
