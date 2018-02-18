# API conventions

## Naming conventions

| Method | Purpose |
| ------ | --------|
| get    | Returns exactly one record identified by one or another unique identifiers as an object (promise). |
| find   | Returns 0 to many records indentified by various criteria as an array (promise). |

## Method conventions

All methods should take an object as the first argument and destructure the parameters of interest, e.g:
```
  get: async ({ hash, height }) => {
  },
  find: async ({ fromHeight, limit }) => {
  }
```

This is to allow us to pass through requests from GraphQL a minimal amount of argument transformation boilerplate.