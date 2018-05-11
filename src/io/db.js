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


// Database connection
export const db = new Database();
db.useDatabase(process.env.DB_NAME);
db.useBasicAuth(process.env.DB_USER, process.env.DB_PASSWORD);

