// @flow
import fs from 'fs';
import path from 'path';
import program from 'commander';
import {
  getExecuteWrittenConfigsMethods,
  getInterfaceForSubcommand,
  deleteConfigs,
  writeConfigsFromCtf,
  loadConfig
} from '@alfredpkg/core';
import rimraf from 'rimraf';
import generateCtfFromConfig, {
  generateInterfaceStatesFromProject
} from './helpers/ctf';
import { getProjectRoot } from './helpers';

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
  const projectRoot = getProjectRoot();
  const { alfredConfig } = await loadConfig(projectRoot);

  // Get the flags that are passed to the skills
  const skillFlags = args.rawArgs.slice(
    args.rawArgs.findIndex(curr => curr === subcommand) + 1
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

  await deleteConfigs(alfredConfig);

  return Promise.all(
    generateInterfaceStatesFromProject(alfredConfig).map(interfaceState =>
      generateCtfFromConfig(alfredConfig, interfaceState)
        .then(ctf => writeConfigsFromCtf(ctf, alfredConfig))
        .then(ctf => {
          const subcommandInterface = getInterfaceForSubcommand(
            ctf,
            subcommand
          );

          const filteredSkillFlags =
            'handleFlags' in subcommandInterface
              ? subcommandInterface.handleFlags(skillFlags, {
                  interfaceState,
                  alfredConfig
                })
              : skillFlags;

          const commands = getExecuteWrittenConfigsMethods(
            ctf,
            interfaceState,
            alfredConfig
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

          return commands[subcommand](alfredConfig, filteredSkillFlags || []);
        })
    )
  );
})();
