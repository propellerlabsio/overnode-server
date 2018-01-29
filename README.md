
## Environment variables
In production, set the environment variables per your normal procedure for your operating system giving consideration to best security practices.

In local development, you can create a file in the application root directory called `.env` (nothing in the name before the period) and populate it with appropriate values.

The following is an example of the `.env` file contents:
```
BITCOIN_RPC_AUTH=__cookie__:fOSJ+IkNnG9ftV+xrOGpMKvbEPkrCkX1wkVFTv1CLb0=
PG_CONNECTION_STRING=postgresql://overnode_user:overnode_password@localhost/overnode_database
NODE_ENV=development
GRAPHIQL=on
COLLATION_JOB_CHUNK_SIZE=10
```

### BITCOIN_RPC_AUTH

The `user:password` for connecting to the bitcoin node via JSON-RPC.

### PG_CONNECTION_STRING

A postgresql `conninfo` string to connect to the database in the format:

`postgresql://<role>:<password>@<server>/<database>`

### NODE_ENV

Set to `development` or `production` [as appropriate](http://expressjs.com/en/advanced/best-practice-performance.html#set-nodeenv-to-production).

### GRAPHIQL

Set to `on` to make GraphiQL (A graphical interactive in-browser GraphQL IDE) available at the same end point as GraqphQL).  Leave off in production unless you've got CPU/Bandwidth to share in spades.

### COLLATION_JOB_CHUNK_SIZE 

A collation job grabs historical data from the blockchain and summarizes, transposes or otherwise collates it into postgres tables for high performance retrieval and serving to clients.  This parameter determines how many blocks should be processed at a single time.

## Contributing

This project is linted with eslint using the AirBnB style guide rules. 

## TODO
* Add block frequency last hour etec, minutes since last block to answer questions like "Why is BCH taking so long this morning?"