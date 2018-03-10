/**
 * First step in converting the 'block_hash' column in the transaction table to 'block_height'.
 * 
 * I tried to do this initiall in one step by populating the new column as part of the 
 * migration bug it's just dying under the volume in production even though it is
 * using hash indexes for the join. Instead we will use a sync job to copy the data
 * across one block at a time.
 * 
 * Height is both small and more useful on client and would prevent us from
 * having to do table joins in some circumstances to obtain it
 */


exports.up = function(knex, Promise) {
  return knex.schema.table('transaction', (table) => {
    // Add new height column
    return table.integer('block_height');
  }).then(() => {
    // Create index on height column
    return knex.schema.table('transaction', (table) => {
      return table.index('block_height');
    });
  });
};

exports.down = function(knex, Promise) {
    // Drop new height column
  return knex.schema.table('transaction', (table) => {
    return table.dropColumn('block_height');
  });
};
