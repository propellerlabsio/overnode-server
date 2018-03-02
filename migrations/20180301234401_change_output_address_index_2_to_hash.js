
/**
 * Drop and recreate the address field index that was created with the default postgres
 * BTREE type and recreate as a HASH index.  The latter is 30% smaller and faster
 * in equality searches.  Any column containing an address will only every be searched
 * for by full address value so it makes sense to use that index type.
 * 
 * Also use the opportuntiy to allow knex to come up with the index name to 
 * standardize the naming convention with other indexes on different tables.
 */

const tableName = 'output_address';
const oldIndexName = 'output_address_address_index';
const indexFieldName = 'address';

exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    // Drop BTREE index
    return table.dropIndex([indexFieldName], oldIndexName)
  })
  .then(() => {
    return knex.schema.table(tableName, (table) => {
      // Recreate with HASH type and standarized name
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
