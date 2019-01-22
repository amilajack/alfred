// @flow
import fs from 'fs';
import path from 'path';
import program from 'commander';
import {
  getExecuteWrittenConfigsMethods,
  getInterfaceForSubcommand,
  deleteConfigs,
  writeConfigsFromCtf
} from '@alfredpkg/core';
import rimraf from 'rimraf';
import generateCtfFromConfig, {
  generateInterfaceStatesFromProject,
  loadConfigs
} from './helpers/CTF';

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
  const { alfredConfig } = await loadConfigs();

  // Get the flags that are passed to the skills
  const [, ...skillFlags] = args.rawArgs.slice(
    args.rawArgs.findIndex(curr => curr === subcommand)
  );

  // $FlowFixMe
  module.paths.push(`${alfredConfig.root}/node_modules`);

  // Built in, non-overridable skills are added here
  switch (subcommand) {
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

  await deleteConfigs();

  return Promise.all(
    generateInterfaceStatesFromProject().map(interfaceState =>
      generateCtfFromConfig(alfredConfig, interfaceState)
        .then(writeConfigsFromCtf)
        .then(ctf => {
          const commands = getExecuteWrittenConfigsMethods(ctf, interfaceState);
          const subcommandInterface = getInterfaceForSubcommand(
            ctf,
            subcommand
          );

          if (!subcommandInterface.runForAllTargets) {
            if (commandWasExceuted) {
              return true;
            }
            commandWasExceuted = true;
          }

          if (!Object.keys(commands).includes(subcommand)) {
            throw new Error(
              `Subcommand "${subcommand}" is not supported by the skills you have installed`
            );
          }

          return commands[subcommand](alfredConfig, skillFlags || []);
        })
    )
  );
})();
