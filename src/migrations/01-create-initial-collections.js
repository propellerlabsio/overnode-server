
export async function up(db) {
  db.collection('addresses').create();
  db.collection('blocks').create();
  db.collection('new_coins').create();
  db.edgeCollection('confirmations').create();
  db.edgeCollection('inputs').create();
  db.edgeCollection('outputs').create();
  db.collection('scripts').create();
  db.collection('staged_inputs').create();
  db.collection('sync').create();
  db.collection('sync_errors').create();
  db.collection('transactions').create();
}

export async function down(db) {
  db.collection('addresses').drop();
  db.collection('blocks').drop();
  db.collection('new_coins').drop();
  db.edgeCollection('confirmations').drop();
  db.edgeCollection('inputs').drop();
  db.edgeCollection('outputs').drop();
  db.collection('scripts').drop();
  db.collection('staged_inputs').drop();
  db.collection('sync').drop();
  db.collection('sync_errors').drop();
  db.collection('transactions').drop();
}