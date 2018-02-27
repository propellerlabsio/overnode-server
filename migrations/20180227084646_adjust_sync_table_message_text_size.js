
const tableName = 'sync';
exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) =>{
    return table.dropColumn('error_message');
  }).then(() => {
    return knex.schema.table(tableName, (table) => {
      table.string('error_message', 1024).comment('Message of error occuring at error_height');
    });
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) =>{
    return table.dropColumn('error_message');
  }).then(() => {
    return knex.schema.table(tableName, (table) => {
      // Recreate with default size as earlier
      table.string('error_message').comment('Message of error occuring at error_height');
    });
  });
};
