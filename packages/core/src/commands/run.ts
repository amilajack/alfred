import {
  getExecutableWrittenConfigsMethods,
  getInterfaceForSubcommand
} from '.';
import { generateCtfFromConfig, writeConfigsFromCtf } from '../ctf';
import { generateInterfaceStatesFromProject } from '../interface';
import { serial } from '../helpers';
import { ProjectInterface } from '../types';

/**
 * Run an alfred subcommand given an alfred config
 */
export default function run(
  project: ProjectInterface,
  subcommand: string,
  skillFlags: Array<string> = []
) {
  const { config } = project;
  // @HACK This is not a very elegant solution.
  // @HACK @REFACTOR Certain subcommands do not rely on state (lint, test, etc). These
  //                 subcommands are run only once
  const interfaceStates = generateInterfaceStatesFromProject(project);
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
      generateCtfFromConfig(config, interfaceState)
        .then(ctf =>
          config.showConfigs ? writeConfigsFromCtf(project, ctf) : ctf
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
                  config
                })
              : skillFlags;

          const commands = getExecutableWrittenConfigsMethods(
            config,
            ctf,
            interfaceState
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

          return commands[subcommand](config, filteredSkillFlags || []);
        })
    )
  );
}
