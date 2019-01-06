#!/usr/bin/env node
// @flow
const program = require('commander');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');

// @TODO: send the information to a crash reporting service (like sentry.io)
process.on('unhandledRejection', err => {
  throw err;
});

updateNotifier({ pkg }).notify();

program
  .version('0.0.1')
  .description('Alfred')
  .command('new <project-name>', 'Create a new Alfred project')
  .command('learn <skill>', 'Add an Alfred skill to your project')
  .command('run <skill>', 'Run an Alfred skill')
  .command(
    'migrate [glob]',
    'Migrate your codebase to the latest version of ES'
  )
  .parse(process.argv);
