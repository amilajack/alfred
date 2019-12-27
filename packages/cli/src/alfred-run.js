// @flow
import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';
import program from 'commander';
import {
  getInterfaceForSubcommand,
  getExecuteWrittenConfigsMethods
} from '@alfred/core';
import {
  generateCtfFromConfig,
  writeConfigsFromCtf
} from '@alfred/core/lib/ctf';
import { generateInterfaceStatesFromProject } from '@alfred/core/lib/interface';

import rimraf from 'rimraf';
import { deleteConfigs, init, serial, getInstallCommmand } from '.';

(async () => {
  const args = program.parse(process.argv);
  const { args: subcommands = [] } = args;
  const { alfredConfig } = await init();

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

  const nodeModulesPath = `${alfredConfig.root}/node_modules`;
  // Install the modules if they are not installed if autoInstall: true
  // @TODO @HACK Note that this might cause issues in monorepos
  if (alfredConfig.autoInstall === true && !fs.existsSync(nodeModulesPath)) {
    const installCommand = getInstallCommmand(alfredConfig);
    childProcess.execSync(installCommand, {
      cwd: alfredConfig.root,
      stdio: 'inherit'
    });
  }
  // $FlowFixMe
  module.paths.push(nodeModulesPath);

  await deleteConfigs(alfredConfig);

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
      // @HACK This is not a very elegant solution.
      // @HACK @REFACTOR Certain subcommands do not rely on state (lint, test, etc). These
      //                 subcommands are run only once
      const interfaceStates = generateInterfaceStatesFromProject(alfredConfig);
      // Validate that “start” subcommand should only work for apps
      // @REFACTOR This validation logic should be handled by the @alfred/interface-start interface
      if (subcommand === 'start') {
        const hasAppInterfaceState = interfaceStates.some(
          interfaceState => interfaceState.projectType === 'app'
        );
        if (!hasAppInterfaceState) {
          throw new Error(
            'The “start” subcommand can only be used with app project types'
          );
        }
      }

      let commandWasExceuted = false;

      // Run this serially because concurrently running parcel causes issues
      return serial(
        interfaceStates.map(interfaceState => () =>
          generateCtfFromConfig(alfredConfig, interfaceState)
            .then(ctf =>
              alfredConfig.showConfigs
                ? writeConfigsFromCtf(ctf, alfredConfig)
                : ctf
            )
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

              return commands[subcommand](
                alfredConfig,
                filteredSkillFlags || []
              );
            })
        )
      );
    }
  }
})();
