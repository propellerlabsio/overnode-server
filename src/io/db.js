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

/**
 * Attempt to create a document in a collection, ignoring duplicate key errors
 *
 * It is often more efficient for us to attempt to create the record in case it doesn't
 * exist than to read the database first to establish whether not we need to
 * create it.
 *
 * @param {*} collection
 * @param {*} document
 * @param {*} from        From document (upserting edge)
 * @param {*} to          To document (upserting edge)
 */
export async function createIgnoreDuplicate(collection, document, from, to) {
  try {
    if (from && to) {
      // Attempt to create edge
      await collection.save(document, from, to);
    } else {
      // Attempt to create document
      await collection.save(document);
    }
  } catch (err) {
    if (!isDuplicateKeyError(err)) {
      throw err;
    }
  }
}

/**
 * Attempt to create a document or edge and if that fails because of
 * a duplicate key error then attempt to update the original
 *
 * arangodb javascript api provides no upsert so this is our alternative.
 *
 * @param {*} collection
 * @param {*} document
 * @param {*} from        From document (upserting edge)
 * @param {*} to          To document (upserting edge)
 */
export async function upsert(collection, document, from, to) {
  try {
    if (from && to) {
      // Attempt to create edge
      await collection.save(document, from, to);
    } else {
      // Attempt to create document
      await collection.save(document);
    }
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

