const tableName = 'user';

exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    table.increments();
    table.string('name').unique();
    table.string('password', 1024);
    table.string('salt').comment('Salt value used in password hashing');
    table.integer('iterations').comment('Number of iterations used in password hashing');
    table.boolean('is_admin').default(false).comment('User has admin rights.');
  });
}

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};
