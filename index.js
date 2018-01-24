
// Load local environment variables first
require('dotenv').config();

// Start server (babel-fied version in dist folder - run `npm run build` if it doesn't exist)
require('./dist/start');
