#!/usr/bin/env node
// @flow
const program = require('commander');

program
  .version('0.0.1')
  .description('Alfred')
  .command('migrate [glob]', 'add your glob here').alias('m')
  .parse(process.argv);

// here .command() is invoked with a description,
// and no .action(callback) calls to handle sub-commands.
// this tells commander that you're going to use separate
// executables for sub-commands, much like git(1) and other
// popular tools.

// here only ./pm-install(1) is implemented, however you
// would define ./pm-search(1) and ./pm-list(1) etc.

// Try the following:
//   ./examples/pm
//   ./examples/pm help install
//   ./examples/pm install -h
//   ./examples/pm install foo bar baz
//   ./examples/pm install foo bar baz --force
