
export async function up(db) {
  db.collection('addresses').create();
  db.collection('blocks').create();
  db.edgeCollection('confirmations').create();
  db.collection('outputs').create();
  db.edgeCollection('received').create();
  db.collection('sync').create();
  db.collection('sync_errors').create();
  db.collection('transactions').create();
}

export async function down(db) {
  db.collection('addresses').drop();
  db.collection('blocks').drop();
  db.edgeCollection('confirmations').drop();
  db.collection('outputs').drop();
  db.edgeCollection('received').drop();
  db.collection('sync').drop();
  db.collection('sync_errors').drop();
  db.collection('transactions').drop();
}