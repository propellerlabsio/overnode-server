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
    }).then(() => {
      // Copy latest location details into the new table.  Due to the old primary key
      // of the peer table different versions of this data has been recorded for different
      // ports on different days and we can't just insert it directly as is into gelocation
      return knex('peer')
        .select('ip_address')
        .max('location_fetched as location_fetched')
        .groupBy('ip_address')
        .then((results) => {
          const promises = [];
          results.forEach((result) => {
            const update = knex('peer')
              .where('ip_address', result.ip_address)
              .andWhere('location_fetched', result.location_fetched)
              .first()
              .then((peer) => {
                delete peer.port;
                return knex('geolocation')
                  .insert(peer);
              });
            promises.push(update);
          })
          return Promise.all(promises);
        });
    }).then(() => {
      // Now drop the old columns from the peer table
      return knex.schema.table('peer', (table) => {
        table.dropColumn('location_fetched');
        table.dropColumn('country');
        table.dropColumn('country_code');
        table.dropColumn('region');
        table.dropColumn('region_name');
        table.dropColumn('city');
        table.dropColumn('zip');
        table.dropColumn('lat');
        table.dropColumn('lon');
        table.dropColumn('proxy');
        table.dropColumn('timezone');
        table.dropColumn('isp');
        table.dropColumn('org');
        table.dropColumn('as');
      });
    });
};

exports.down = function (knex) {
  // Recreate fields we dropped from peer table
  return knex.schema.table('peer', (table) => {
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
  }).then(() => {
    // Copy address data out of geolocation into peer table
    return knex('geolocation')
      .select()
      .then((results) => {
        const promises = [];
        results.forEach((result) => {
          const update = knex('peer')
            .where('ip_address', result.ip_address)
            .update(result);
          promises.push(update);
        });
        return Promise.all(promises);
      });
  }).then(() => {
    // Drop new geolocation table
    return knex.schema.dropTable(tableName);
  });
};