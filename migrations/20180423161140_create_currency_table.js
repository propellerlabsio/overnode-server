
const tableName = 'currency';
const lastUnixTime = '2147483647';

exports.up = function(knex, Promise) {
  return knex.schema.createTable(tableName, (table) => {
    table.string('code', 4).primary().comment('Currency code, BCH, USD, EUR etc');
    table.string('label', 25);
    table.decimal('bch_rate', 16, 8);
    table.integer('rate_updated');  // Y2038 bug
  }).then(() => {
    return knex(tableName).insert([{
      code: 'BCH',
      label: 'Bitcoin Cash',
      bch_rate: 1,
      rate_updated: lastUnixTime,
    }, {
      code: 'BTC',
      label: 'Bitcoin Core',
    }, {
      code: 'USD',
      label: 'United States Dollars',
    }]);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable(tableName);
};
