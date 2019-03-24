#!/usr/bin/env node
// @flow
import dark from 'dark';
import updateNotifier from 'update-notifier';
import pkg from '../package.json';

// @TODO Send the information to a crash reporting service (like sentry.io)
process.on('unhandledRejection', err => {
  throw err;
});

updateNotifier({ pkg }).notify();

const program = dark()
  .version(pkg.version, '-v, --version')
  .description('A Modular JS Toolchain')
  .command('new <project-name>', 'Create a new Alfred project')
  .command('learn <skill>', 'Add an Alfred skill to your project')
  .command('skills', 'List all the subcommands and skills')
  .command('run <skill>', 'Run an Alfred skill')
  .command('migrate [glob]', 'Migrate to the latest version of ES')
  .parse(process.argv);

export default program;
