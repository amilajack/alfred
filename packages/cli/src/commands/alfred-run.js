// @flow
import program from 'commander';
import Alfred from '@alfred/core';

(async () => {
  const args = program.parse(process.argv);
  const { args: subcommands = [] } = args;

  switch (subcommands.length) {
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

  const [subcommand] = subcommands;

  // Get the flags that are passed to the skills
  const skillFlags = args.rawArgs.slice(
    args.rawArgs.findIndex(curr => curr === subcommand) + 1
  );

  const { alfred } = await Alfred();
  return alfred.run(subcommand, {
    flags: skillFlags
  });
})();
