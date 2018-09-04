
Overnode is a Bitcoin full node monitoring and explorer (query) tool.  This project contains the server code which prodes a GraphQL interface for interacting with the node. 

There is an example client / UI implementation written in VueJs which is hosted at [overnode.org](https://overnode.org).

**WARNING:** 

**This project is heavily under construction and in a beta state.  Some functionality is missing and there may be outstanding security flaws.  Do not run this code exposed to the internet with a bitcoin node containing a live, non-test wallet**

# Quick setup

## Prerequisites

1. You need an empty / dedicated postgresql database available.

2. You need to configure your [Environment variables](#environment-variables).

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
NETWORK=regtest
DATA_DIR=/mnt/blockchain/bcash/
NODE_ENV=development
GRAPHIQL=on
PORT=4000
DONATION_ADDRESS=bitcoincash:qqtfhm837rqfteckfm5khxj69y8yyscywc6g4e70em
```

### NETWORK
Bitcoin network: `regtest`, `testnet`, `main`.

### DATA_DIR
File system folder where bcoin node data (blockchain etc) will be stored.  Note: this directory must be precreated before running for the first time.

### MAX_OUTBOUND
(Optional) maximum number of bitcoin node outbound connections.

### PEERS
(Optional) comma separated list of other bitcoin nodes to connect to

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

