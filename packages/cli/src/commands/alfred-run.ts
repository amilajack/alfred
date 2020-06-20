import program from 'commander';
import { Signale } from 'signale';
import alfred from '@alfred/core';
import { getSingleSubcommandFromArgs } from '..';

(async (): Promise<void> => {
  const args = program.parse(process.argv);
  const { args: subCommands = [] } = args;
  const subCommand = getSingleSubcommandFromArgs(subCommands);
  const project = await alfred();

  const validation = project.validatePkgJson();
  if (validation.messagesCount) {
    const signale = new Signale();
    signale.note(project.pkgPath);
    validation.recommendations.forEach((warning) => {
      signale.warn(warning);
    });
    validation.warnings.forEach((warning) => {
      signale.warn(warning);
    });
    validation.errors.forEach((warning) => {
      signale.error(warning);
    });
  }

  // Get the flags that are passed to the skills
  const skillFlags = args.rawArgs.slice(
    args.rawArgs.findIndex((curr: string) => curr === subCommand) + 1
  );
  await project.run(subCommand, skillFlags);
})();
