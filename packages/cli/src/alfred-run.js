// @flow
import fs from 'fs';
import path from 'path';
import program from 'commander';
import {
  getExecuteWrittenConfigsMethods,
  getInterfaceForSubcommand
} from '@alfredpkg/core';
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

  // $FlowFixMe
  module.paths.push(`${alfredConfig.root}/node_modules`);

  switch (skill) {
    case 'clean': {
      const targetsPath = path.join(alfredConfig.root, 'targets');
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

  // @HACK This is not a very elegant solution.
  // @HACK @REFACTOR Certain subcommands do not rely on state (lint, test, etc). These
  //                 subcommands are run only once
  let commandWasExceuted = false;

  return Promise.all(
    generateInterfaceStatesFromProject().map(interfaceState =>
      generateCtfFromConfig(alfredConfig, interfaceState).then(ctf => {
        const commands = getExecuteWrittenConfigsMethods(ctf, interfaceState);
        const skillInterface = getInterfaceForSubcommand(ctf, skill);

        if (!skillInterface.runForAllTargets) {
          if (commandWasExceuted) {
            return true;
          }
          commandWasExceuted = true;
        }

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
