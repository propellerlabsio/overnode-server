
/**
 * Drop and recreate the transaction id index that was created with the default postgres
 * BTREE type and recreate as a HASH index.  The latter is 30% smaller and faster
 * in equality searches.  Any column containing a hash (transaction id, block hash)
 * etc will only every be searched for by full hash so it makes sense to use that
 * index type.
 * 
 * Also use the opportuntiy to allow knex to come up with the index name to 
 * standardize the naming convention with other indexes on different tables.
 */

const tableName = 'output';
const oldIndexName = 'transaction_id';
const indexFieldName = 'transaction_id';

exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    // Drop BTREE index
    return table.dropIndex([indexFieldName], oldIndexName)
  })
  .then(() => {
    return knex.schema.table(tableName, (table) => {
      // Recreate with HASH type and standardized name
      return table.index([indexFieldName], null, 'HASH');
    });
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    // Drop HASH index
    return table.dropIndex([indexFieldName])
  })
  .then(() => {
    return knex.schema.table(tableName, (table) => {
      // Recreate with default type (BTREE)
      return table.index([indexFieldName], oldIndexName);
    });
  });
};
