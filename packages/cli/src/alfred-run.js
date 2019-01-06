// @flow
import program from 'commander';
import { getExecuteWrittenConfigsMethods } from '@alfredpkg/core';
import generateCtfFromConfig from './helpers/CTF';

(async () => {
  const args = program.parse(process.argv);
  const { args: skills = [] } = args;

  switch (skills.length) {
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

  const [skill] = skills;
  const { ctf } = await generateCtfFromConfig();
  const commands = getExecuteWrittenConfigsMethods(ctf, {});

  if (!Object.keys(commands).includes(skill)) {
    throw new Error(
      `Subcommand "${skill}" is not supported by the skills you have`
    );
  }

  commands[skill]();
})();
