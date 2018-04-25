
const tableName = 'currency';
const lastUnixTime = '2147483647';

exports.up = function(knex, Promise) {
  return knex.schema.createTable(tableName, (table) => {
    table.string('code', 4).primary().comment('Currency code, BCH, USD, EUR etc');
    table.string('label', 25);
    table.decimal('bch_rate', 16, 8);
    table.integer('decimal_places');
    table.integer('rate_updated');  // Y2038 bug
  }).then(() => {
    return knex(tableName).insert([{
      code: 'BCH',
      label: 'Bitcoin Cash',
      bch_rate: 1,
      rate_updated: lastUnixTime,
      decimal_places: 8,
    }, {
      code: 'BTC',
      label: 'Bitcoin Core',
      decimal_places: 8,
    }, {
      code: 'USD',
      label: 'United States Dollars',
      decimal_places: 2,
    }]);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable(tableName);
};
