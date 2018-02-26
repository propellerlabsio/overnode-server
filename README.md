
# Overnode

Overnode is a Bitcoin full node monitoring and explorer (query) tool.  This project contains the server code which prodes a GraphQL interface for interacting with the node. 

There is an example client / UI implementation written in VueJs which is hosted at [overnode.org](https://overnode.org).

**WARNING:** 

**This project is heavily under construction and in a beta state.  Some functionality is missing and there may be outstanding security flaws.  Do not run this code exposed to the internet with a bitcoin node containing a live, non-test wallet**

## Quick setup

### Prerequisites

1. You need a Bitcoin Cash full node running with RPC access.  This software has been developed with Bitcoin Unlimited Cash but may work with others.

2. You need an empty / dedicated postgresql database available.

3. You need to configure your [Environment variables](#environment-variables).

### Building and running

``` bash
# install dependencies
npm install

# build and run
npm run dev

# build for production
npm run build
```

## Deploying

Prior to deploying, on your development machine, run `npm version patch` to:

1. Increment the package version in `package.json`.
2. Commit and push the new version to Github.
3. Publish the new release.

This will allow the client to know a refresh is required.

## Contributing

TODO - complete this section.

### Style

This project is linted with eslint using the AirBnB style guide rules.

### Field naming conventions

Postgresql doesn't support camelcase field names and instead components of field names are separated by the underscore character.  In order to remove the need for extensive transalation, GraphQL queries return properties in the same format.  GraphQL types however follow normal GraphQL naming conventions.  Field names in JSON data returned by bitcoind are inconsistent from query to query and are translated to our standard on storage or presentation.

## Reference

### Environment variables
In production, set the environment variables per your normal procedure for your operating system giving consideration to best security practices.

In local development, you can create a file in the application root directory called `.env` (nothing in the name before the period) and populate it with appropriate values.

The following is an example of the `.env` file contents:
```
BITCOIN_RPC_AUTH=overnode:fOSJ+IbkNnG9ftV+xrOGpMKvbEPkrCkX1wkVFTv1CLb0=
PG_CONNECTION_STRING=postgresql://overnode:overnode@localhost/overnode
NODE_ENV=development
GRAPHIQL=on
PORT=4000
DONATION_ADDRESS=bitcoincash:qqtfhm837rqfteckfm5khxj69y8yyscywc6g4e70em
```

#### BITCOIN_RPC_AUTH

The `user:password` for connecting to the bitcoin node via JSON-RPC.  If this environment variable is not provided, it is necessary that the BITCOIN_COOKIE_DIRECTORY variable be set.

#### BITCOIN_COOKIE_DIRECTORY

If no BITCOIN_RPC_AUTH is provided, this folder is read for a file called `.cookie` which is recreated on restart of the `bitcoind` daemon and contains the RPC credentials that can be used to log in.

#### PG_CONNECTION_STRING

A postgresql `conninfo` string to connect to the database in the format:

`postgresql://<role>:<password>@<server>/<database>`

#### NODE_ENV

Set to `development` or `production` [as appropriate](http://expressjs.com/en/advanced/best-practice-performance.html#set-nodeenv-to-production).

#### GRAPHIQL

Set to `on` to make GraphiQL (A graphical interactive in-browser GraphQL IDE) available at the same end point as GraqphQL).  Leave off in production unless you've got CPU/Bandwidth to share in spades.

#### DONATION_ADDRESS

If you would like to receive donations for hosting this service, put your Bitcoin address here.
