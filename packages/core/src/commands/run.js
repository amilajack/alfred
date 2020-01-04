import {
  getExecutableWrittenConfigsMethods,
  getInterfaceForSubcommand
} from '.';
import { generateCtfFromConfig, writeConfigsFromCtf } from '../ctf';
import { generateInterfaceStatesFromProject } from '../interface';
import { serial } from '../helpers';
import type { AlfredConfig } from '../types';

/**
 * Run an alfred subcommand given an alfred config
 * @param {*} alfredConfig
 * @param {*} subcommand
 * @param {*} skillFlags
 */
export default function run(
  alfredConfig: AlfredConfig,
  subcommand: string,
  skillFlags: Array<string>
) {
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

          const commands = getExecutableWrittenConfigsMethods(
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
}
