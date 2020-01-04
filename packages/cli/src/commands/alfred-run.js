// @flow
import program from 'commander';
import alfred from '@alfred/core';

(async () => {
  const args = program.parse(process.argv);
  const { args: subCommands = [] } = args;

  switch (subCommands.length) {
    case 0: {
      throw new Error('One subcommand must be passed');
    }
    case 1: {
      break;
    }
    default: {
      throw new Error('Only one subcommand can be passed');
    }
  }

  const [subcommand] = subCommands;

  // Get the flags that are passed to the skills
  const skillFlags = args.rawArgs.slice(
    args.rawArgs.findIndex(curr => curr === subcommand) + 1
  );

  const project = await alfred();
  return project.run(subcommand, {
    flags: skillFlags
  });
})();
