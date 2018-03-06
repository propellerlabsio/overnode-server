
/**
 * Adjust input_staging indexes: drop old transaction id index, create primary key using transaction_id and input_index 
 * and add index for output transaction + output index
 */

const tableName = 'input_staging';

exports.up = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    return table.dropIndex(['transaction_id']);
  }).then(() => {
    return knex.schema.table(tableName, (table) => {
      return Promise.all([
        table.primary(['transaction_id', 'input_number']),
        table.index(['output_transaction_id', 'output_number']),
      ]);
    });
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(tableName, (table) => {
    return Promise.all([
      table.dropPrimary(['transaction_id', 'input_number']),
      table.dropIndex(['output_transaction_id', 'output_number']),
    ]);
  }).then(() => {
    return knex.schema.table(tableName, (table) => {
        return table.index(['transaction_id']);
    });
  });
};
