// @flow
import path from 'path';
import program from 'commander';
import alfred from '@alfred/core';
import Providers from '../providers';

(async () => {
  const parsedArguments = program
    .option('-u, --unsafe', 'allow unsafe transformations')
    .option('-v, --verbose', 'show verbose output')
    .option('-d, --debug', 'show debugging output')
    .parse(process.argv);

  const { config } = await alfred();
  const { root, pkgPath } = config;

  const filesPattern: Array<string> = parsedArguments.args.map(arg =>
    path.join(root, arg)
  );

  // @TODO Create backups from the files and pass the paths to the backups
  //        instead of the actual filenames. Preserve the original filenames
  //        if the migration was successful and we want to write to the original
  //        files
  return Providers(
    {
      files: filesPattern,
      packageJsonPath: pkgPath,
      unsafe: parsedArguments.unsafe,
      verbose: parsedArguments.verbose,
      write: parsedArguments.write
    },
    config
  );
})();
