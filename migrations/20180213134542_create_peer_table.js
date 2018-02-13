const tableName = 'peer';

exports.up = function (knex) {
  return knex
    .schema
    .createTable(tableName, function (table) {
      table.string('address', 64).primary().comment('IP address of peer');
      table.date('location_fetched').comment('Date/time of when geo location was last updated')
      table.string('country');
      table.string('country_code', 3);
      table.string('region', 10);
      table.string('region_name', 50);
      table.string('city', 50);
      table.string('zip', 15);
      table.float('lat');
      table.float('lon');
      table.boolean('proxy');
      table.string('timezone', 50);
      table.string('isp', 100);
      table.string('org', 100);
      table.string('as', 100);

      // {
      //   "country": "United States",
      //   "countryCode": "US",
      //   "region": "CA",
      //   "regionName": "California",
      //   "city": "San Francisco",
      //   "zip": "94105",
      //   "lat": "37.7898",
      //   "lon": "-122.3942",
      //   "timezone": "America\/Los_Angeles",
      //   "isp": "Wikimedia Foundation",
      //   "org": "Wikimedia Foundation",
      //   "as": "AS14907 Wikimedia US network",
      // }      
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};