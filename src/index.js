#!/usr/bin/env node
// @flow
const program = require('commander');

program
  .version('0.0.1')
  .description('Alfred')
  .command('migrate [glob]', 'add your glob here').alias('m')
  .parse(process.argv);
