
## Environment variables
Create a file in the application root directory called `.env` (nothing in the name before the period) and populate it with appropriate values.  Note: in development, the application root directory is the `dist/` folder.

The following is an example `.env`:
```
JWT_SIGNING_KEY=aefe3182-873e-430e-8f25-ab9759ae5320
PG_CONNECTION_STRING=postgresql://node_commander:node_commander@localhost/node_commander
HASH_PASSWORD_ITERATIONS=10000
NODE_ENV=development
GRAPHIQL=on
```

### JWT_SIGNING_KEY

This is a secret used to sign JSON Web Tokens.  In production, it should be randomly generated preferablly via uuid.v4().  In development, any string will suffice (e.g. `secret`).

### PG_CONNECTION_STRING

A postgresql `conninfo` string to connect to the database in the format:

`postgresql://<role>:<password>@<server>/<database>`


### HASH_PASSWORD_ITERATIONS

The number of iterations to use when hashing a user's password - the higher the number, the harder to crack but heavier cost in time and CPU.


### NODE_ENV

Set to `development` or `production` [as appropriate](http://expressjs.com/en/advanced/best-practice-performance.html#set-nodeenv-to-production).

### GRAPHIQL

Set to `on` to make GraphiQL (A graphical interactive in-browser GraphQL IDE) available at the same end point as GraqphQL).  Leave off in production unless you've got CPU/Bandwidth to share in spades.

## Contributing

This project is linted with eslint using the AirBnB style guide rules. 

## TODO
* Add block frequency last hour etec, minutes since last block to answer questions like "Why is BCH taking so long this morning?"