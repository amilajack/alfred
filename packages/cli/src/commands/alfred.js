#!/usr/bin/env node
// @flow
import program from 'commander';
import updateNotifier from 'update-notifier';
import pkg from '../../package.json';

// @TODO Send the information to a crash reporting service (like sentry.io)
process.on('unhandledRejection', err => {
  throw err;
});

// Notify the user if there are new versions of alfred available
updateNotifier({ pkg }).notify();

program
  .version(pkg.version, '-v, --version')
  .description('A Modular JS Toolchain')
  .command('new <project-name>', 'Create a new Alfred project')
  .command('learn <skill>', 'Add an Alfred skill to your project')
  .command('skills', 'List all the subcommands and skills')
  .command('run <skill>', 'Run an Alfred skill')
  .command('migrate [glob]', 'Migrate to the latest version of ES')
  .parse(process.argv);
