#!/usr/bin/env node
// @flow
import path from 'path';
import program from 'commander';
import Providers from './providers';

program.parse(process.argv);

const filesPattern: Array<string> =
  program.args.map(arg => path.join(process.cwd(), arg));

console.log(filesPattern);

// @TODO: Create backups from the files and pass the paths to the backups
//        instead of the actual filenames. Preserve the original filenames
//        if the migration was successful and we want to write to the original
//        files
Providers({
  files: filesPattern
})
  .catch(console.log);
