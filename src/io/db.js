import { Database } from 'arangojs';

const DUPE_KEY_ERROR_CODE = 409;
const DUPE_KEY_ERROR_NUM = 1210;

/**
 * Test if error is a duplicate key / unique key constraint violation
 *
 * @param {*} err
 */
export function isDuplicateKeyError(err) {
  return err.code === DUPE_KEY_ERROR_CODE && err.errorNum === DUPE_KEY_ERROR_NUM;
}

export async function upsert(collection, document) {
  try {
    await collection.save(document);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      // eslint-disable-next-line no-underscore-dangle
      await collection.update(document._key, document);
    } else {
      throw err;
    }
  }
}

export async function upsertEdge(collection, document, from, to) {
  try {
    await collection.save(document, from, to);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      // eslint-disable-next-line no-underscore-dangle
      await collection.update(document._key, document);
    } else {
      throw err;
    }
  }
}


// Database connection
export const db = new Database();
db.useDatabase(process.env.DB_NAME);
db.useBasicAuth(process.env.DB_USER, process.env.DB_PASSWORD);

