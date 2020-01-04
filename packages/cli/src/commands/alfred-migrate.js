// @flow
import path from 'path';
import program from 'commander';
import Alfred from '@alfred/core';
import Providers from '../providers';

(async () => {
  const parsedArguments = program
    .option('-u, --unsafe', 'allow unsafe transformations')
    .option('-v, --verbose', 'show verbose output')
    .option('-d, --debug', 'show debugging output')
    .parse(process.argv);

  const alfred = new Alfred();
  const { projectRoot, alfredConfig } = await alfred.init();

  const filesPattern: Array<string> = parsedArguments.args.map(arg =>
    path.join(projectRoot, arg)
  );

  // @TODO Create backups from the files and pass the paths to the backups
  //        instead of the actual filenames. Preserve the original filenames
  //        if the migration was successful and we want to write to the original
  //        files
  Providers(
    {
      files: filesPattern,
      packageJsonPath: path.join(projectRoot, 'package.json'),
      unsafe: parsedArguments.unsafe,
      verbose: parsedArguments.verbose,
      write: parsedArguments.write
    },
    alfredConfig
  );
})();
