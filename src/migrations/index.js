import fs from 'fs';
import path from 'path';
import { db } from '../io/db';

const migrationsCollection = db.collection('migrations');
let migrationModules = [];
let alreadyMigrated = [];

/**
 * Load migrations from database and migration javascript module names from fs
 */
async function setup() {
  // Establish if migrations collection exists, if not, create it
  try {
    await migrationsCollection.load();
    const cursor = await migrationsCollection.all();
    alreadyMigrated = await cursor.all();
  } catch (err) {
    if (err.statusCode === 404) {
      migrationsCollection.create();
    } else {
      throw err;
    }
  }

  // Load migrations javascript files from current folder
  migrationModules = fs.readdirSync(__dirname).filter((file) => 
    file !== 'index.js' && !file.includes('.map')
  );
}

/**
 * Execute all migrations that haven't already been performed up until
 * the latest one
 */
export async function latest() {
  await setup();
  migrationModules
    .filter((moduleName) => {
      // Filter out already migrated
      const existingIndex = alreadyMigrated.findIndex(existing =>
        existing._key === moduleName);
      return existingIndex < 0;
    })
    .forEach(async (moduleName) => {
      // See if migration has already been executed
      const { up } = require(path.join(__dirname, moduleName));
      await up(db);
      await migrationsCollection.save({ 
        _key: moduleName,
        time: Date.now(),
      });
      console.log(`Migration '${moduleName}' finished.`)
    });
}

/**
 * Rollback a the single, latest migration that has been executed
 */
export async function rollback() {
  await setup();
  const toRollBack = alreadyMigrated
    .sort((a, b) => a.time - b.time)
    .shift();
  
  if (toRollBack) {
    // See if migration has already been executed
    const { down } = require(path.join(__dirname, toRollBack._key));
    await down(db);
    await migrationsCollection.remove(toRollBack._key);
    console.log(`Migration '${toRollBack._key}' rolled back.`)
  } else {
    console.log('Nothing to rollback');
  }
}
