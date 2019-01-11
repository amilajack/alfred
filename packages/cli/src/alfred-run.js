// @flow
import fs from 'fs';
import path from 'path';
import program from 'commander';
import { getExecuteWrittenConfigsMethods } from '@alfredpkg/core';
import rimraf from 'rimraf';
import generateCtfFromConfig, {
  generateInterfaceStatesFromProject,
  loadConfigs
} from './helpers/CTF';

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
  const { alfredConfig } = await loadConfigs();

  switch (skill) {
    case 'start': {
      // @TODO Start the dev server
      break;
    }
    case 'clean': {
      const targetsPath = path.join(process.cwd(), 'targets');
      if (fs.existsSync(targetsPath)) {
        await new Promise(resolve => {
          rimraf(targetsPath, () => {
            resolve();
          });
        });
      }
      return Promise.resolve();
    }
    default: {
      break;
    }
  }

  return Promise.all(
    generateInterfaceStatesFromProject().map(state =>
      generateCtfFromConfig(alfredConfig, state).then(ctf => {
        const commands = getExecuteWrittenConfigsMethods(ctf, state);

        if (!Object.keys(commands).includes(skill)) {
          throw new Error(
            `Subcommand "${skill}" is not supported by the skills you have installed`
          );
        }

        return commands[skill](alfredConfig);
      })
    )
  );
})();
