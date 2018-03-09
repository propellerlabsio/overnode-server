/**
 * Convert the 'block_hash' column in the transaction table to 'block_height'.
 * 
 * Height is both small and more useful on client and would prevent us from
 * having to do table joins in some circumstances to obtain it
 */


exports.up = function(knex, Promise) {
  return knex.schema.table('transaction', (table) => {
    // Add new height column
    table.integer('block_height');
  }).then(() => {
    // Update height column for all transactions
    return knex.raw(`
      UPDATE transaction
      SET    block_height = block.height
      FROM   block
      WHERE  block.hash = transaction.block_hash;
    `);
  }).then(() => {
    // Drop old hash column and create index on height column
    return knex.schema.table('transaction', (table) => {
      return Promise.all([
        table.dropColumn('block_hash'),
        table.index('block_height'),
      ]);
    });
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('transaction', (table) => {
    // Restore old hash column
    table.string('block_hash', 64);
  }).then(() => {
    // Update block_hash column for all transactions
    return knex.raw(`
      UPDATE transaction
      SET    block_hash = block.hash
      FROM   block
      WHERE  block.height = transaction.block_height;
    `);
  }).then(() => {
    // Drop new height column and recreate index on restored hash column
    return knex.schema.table('transaction', (table) => {
      return Promise.all([
        table.dropColumn('block_height'),
        table.index('block_hash'),
      ]);
    });
  });
};
