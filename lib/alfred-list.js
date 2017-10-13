#!/usr/bin/env node
'use strict';

const program = require('commander');

program.option('-f, --force', 'force installation').parse(process.argv);

const pkgs = program.args;

if (!pkgs.length) {
  console.error('packages required');
  process.exit(1);
}

console.log();
if (program.force) console.log('  force: install');
pkgs.forEach(pkg => {
  console.log('  install : %s', pkg);
});
console.log();