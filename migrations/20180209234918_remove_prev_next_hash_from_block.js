
exports.up = function(knex, Promise) {
  return knex.schema.table('block', (table) =>{
    table.dropColumn('previousblockhash');
    table.dropColumn('nextblockhash');
    table.string('coinbase', 200);
  })
};

exports.down = function(knex, Promise) {
  // Can't undo - data is gone.  Return empty promise
  return knex.schema.table('block', (table) =>{
    table.string('previousblockhash', 64);
    table.string('nextblockhash', 64);
    table.dropColumn('coinbase');
  })
  
};
