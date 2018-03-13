/**
 * TXO (output) addresses are currently stored normalized in the table output_address.  Whilst
 * the bitcoin node returns an array for addresses, it appears that the overwhelming majority
 * of TXOs only go to a single address.  Having a seperate table for these addresses is very
 * expensive so this migration adds an address field directly to the output table where
 * the address for single-address TXOs can be stored.  The second table, output_address,
 * will be retained for the infrequent occasions where a single TXO has multiple addresses.
 */

const tableName = 'output';

exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    table
      .string('address', 42)
      .comment('Output address if output has single address.  Refer output_address if blank for multiple addresses');
    table.index('address', null, 'HASH');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    table.dropColumn('address');
  });
};
