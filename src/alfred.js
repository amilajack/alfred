#!/usr/bin/env node
// @flow
const program = require('commander');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');

updateNotifier({ pkg }).notify();

program
  .version('0.0.1')
  .description('Alfred')
  .command('migrate [glob]', 'add your glob here')
  .alias('m')
  .parse(process.argv);
