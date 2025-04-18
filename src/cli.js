#!/usr/bin/env node

import { createServer } from './JSDWAServer.js';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  cache: args.includes('--cache'),
  port: parseInt(args[args.indexOf('--port') + 1]) || undefined
};

// Start the server with the provided options
createServer(options);
