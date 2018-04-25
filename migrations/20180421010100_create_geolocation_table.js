/**
 * Create geolocation table keyed by ip address and then move geolocation data out of the
 * peer table into the new table.
 */

const tableName = 'geolocation';

exports.up = function (knex) {
  // Create geolocation table
  return knex
    .schema
    .createTable(tableName, function (table) {
      table.string('ip_address', 64).primary().comment('IP address');
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
    });
};

exports.down = function (knex) {
  // Drop new geolocation table
  return knex.schema.dropTable(tableName);
};