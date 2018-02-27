/**
 * Revert last migration - slightly longer error messages aren't helpful as sometimes they
 * can be megabytes in size (sql errors) with the meat at the beginning and end.
 * (Can't roll back single migration if it was applied in a batch so doing this as
 * subsequent migration.)
 */

const tableName = 'sync';

exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) =>{
    // Drop column with 1024 length string
    return table.dropColumn('error_message');
  }).then(() => {
    return knex.schema.table(tableName, (table) => {
      // Recreate with default size (256) as it was earlier
      table.string('error_message').comment('Message of error occuring at error_height');
    });
  });
  
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) =>{
    return table.dropColumn('error_message');
  }).then(() => {
    return knex.schema.table(tableName, (table) => {
      table.string('error_message', 1024).comment('Message of error occuring at error_height');
    });
  });
};
