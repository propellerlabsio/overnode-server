/**
 * Split peer address into ip address and port fields in prep for moving geo location
 * data into separate table
 */
exports.up = function(knex, Promise) {
  return knex.schema.table('peer', (table) => {
    // Create new peer ip_address and port fields
    table.string('ip_address', 64).comment('IP address');
    table.integer('port').comment('Port number');
  }).then(() => {
    // Split old peer address field data into ip and port fields
    return knex('peer')
      .select('address')
      .then((results) => {
        const promises = [];
        results.forEach((result)=>{
          const components = result.address.split(':');
          const update = knex('peer')
            .where('address', result.address)
            .update({
              ip_address: components[0],
              port: components[1],
            });
          promises.push(update);
        });
        return Promise.all(promises);
      });
  }).then(() => {
    // Drop old address field and index and create new primary key from ip_address and port
    return knex.schema.table('peer', (table) => {
      table.dropPrimary();
      table.dropColumn('address');
      table.primary(['ip_address', 'port']);
    });
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('peer', (table) => {
    // Recreate old combined address field
    table.string('address', 64).comment('IP address of peer');
  }).then(() => {
    // Combine  data from new ip and port fields into old address field
    return knex('peer')
      .select('ip_address', 'port')
      .then((results) => {
        const promises = [];
        results.forEach((result)=>{
          const address = `${result.ip_address}:${result.port}`;
          const update = knex('peer')
            .where('ip_address', result.ip_address)
            .andWhere('port', result.port)
            .update({ address });
          promises.push(update);
        });
        return Promise.all(promises);
      });
  }).then(() => {
    // Drop new ip_address and port fields and change primary key back to old address field
    return knex.schema.table('peer', (table) => {
      table.dropPrimary();
      table.dropColumn('ip_address');
      table.dropColumn('port');
      table.primary(['address']);
    });
  });
  
};
