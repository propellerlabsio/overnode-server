const tableName = 'input';
exports.up = function (knex) {
  return knex.schema.createTable(tableName, function (table) {
    table.increments();
    table.comment('An input to a bitcoin transaction')
    table.string('transaction_id', 64);
    table.integer('input_index').comment('Input number indexed from 0');
    table.string('block_hash', 64);
    table.string('coinbase', 200);
    table.string('output_transaction_id', 64);
    table.integer('output_index').comment('Output number indexed from 0');

    // NOTE: A foreign key to the output can't be added to this table due to the asynchronous
    // way the transaction is synced to the database.  That is, the
    // transaction output referenced by this input may not exist at the point
    // this record is created.
    table.index('block_hash');
    table.index('transaction_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};