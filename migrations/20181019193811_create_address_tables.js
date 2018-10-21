/**
 * Creates tables 'address_received' and 'address_spent' - our version of an address index
 * 
 * Note this design forgoes normal good table design elements to reduce footprint
 * for what are potentially huge tables and optimize for read time.
 */

const tableReceived = 'address_received';
const tableSpent = 'address_spent';

exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema
      .createTable(tableReceived, function (table) {
        table.string('address', 35)
          .comment('Bitcoin address (non-cashaddr format');
        table.integer('height')
          .comment('Block height (needed for reorgs)');
        table.string('transaction_id', 64)
          .comment('Transaction id in which the funds were received');
        table.integer('output_number')
          .comment('Output number (vout) in which the funds were received');
        table.decimal('value', 16, 8)
          .comment('Value received in BCH');
        table.primary(['address', 'height', 'transaction_id', 'output_number']);
    }),

    knex.schema
      .createTable(tableSpent, function (table) {
        table.string('address', 35)
          .comment('Bitcoin address (non-cashaddr format');
        table.integer('height')
          .comment('Block height (needed for reorgs)');
        table.string('transaction_id', 64)
          .comment('Transaction id in which funds were spent');
        table.integer('input_number')
          .comment('Input number in which the funds were spent');
        table.decimal('value', 16, 8)
          .comment('Value spent in BCH');
        table.primary(['address', 'height', 'transaction_id', 'input_number']);
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable(tableReceived),
    knex.schema.dropTable(tableSpent),
  ]);
};
