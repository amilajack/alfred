#!/usr/bin/env node
import program from 'commander';
import updateNotifier from 'update-notifier';
import 'source-map-support/register';

const pkg = require('../../package.json');

// @TODO Send the information to a crash reporting service (like sentry.io)
process.on('unhandledRejection', err => {
  throw err;
});

// Notify the user if there are new versions of alfred available
if (process.env.ALFRED_E2E_CLI_TEST !== 'true') {
  updateNotifier({ pkg }).notify();
}

program
  .version(pkg.version, '-v, --version')
  .description('A Modular JS Toolchain')
  .command('new <project-name>', 'Create a new Alfred project')
  .command('learn <skill>', 'Add an Alfred skill to your project')
  .command('skills', 'List all the subcommands and skills')
  .command('run <task>', 'Run an Alfred skill')
  .parse(process.argv);
