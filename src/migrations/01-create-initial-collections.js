
export async function up(db) {
  db.collection('addresses').create();
  db.collection('blocks').create();
  db.edgeCollection('confirmations').create();
  db.collection('outputs').create();
  db.edgeCollection('recieved').create();
  db.collection('sync').create();
  db.collection('transactions').create();
}

export async function down(db) {
  db.collection('addresses').drop();
  db.collection('blocks').drop();
  db.edgeCollection('confirmations').drop();
  db.collection('outputs').drop();
  db.edgeCollection('recieved').drop();
  db.collection('sync').drop();
  db.collection('transactions').drop();
}