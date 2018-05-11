
// Load local environment variables first
require('dotenv').config();

// Start migration (babel-fied version in dist folder - run `npm run build` if it doesn't exist)
const migrations = require('./dist/migrations');

const functionName = process.argv[2];
if (!functionName) {
  console.error('Function name ("latest" or "rollback") is a required argument')
} else {
  migrations[functionName]();
}
