import { ProjectInterface } from '@alfred/types';
import {
  getExecutableWrittenConfigsMethods,
  getInterfaceForSubcommand
} from '.';
import { generateCtfFromProject, writeConfigsFromCtf } from '../ctf';
import { generateInterfaceStatesFromProject } from '../interface';
import { serial } from '../helpers';

/**
 * Run an alfred subcommand given an alfred config
 */
export default function run(
  project: ProjectInterface,
  subcommand: string,
  skillFlags: Array<string> = []
): Promise<any> {
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

  // @TODO @HACK Run this serially because concurrently running parcel causes issues
  return serial(
    interfaceStates.map(interfaceState => () =>
      generateCtfFromProject(project, interfaceState)
        .then(ctfMap =>
          config.showConfigs ? writeConfigsFromCtf(project, ctfMap) : ctfMap
        )
        .then(ctfMap => {
          const subcommandInterface = getInterfaceForSubcommand(
            ctfMap,
            subcommand
          );

          const filteredSkillFlags = subcommandInterface.handleFlags
            ? subcommandInterface.handleFlags(skillFlags, {
                interfaceState,
                config
              })
            : skillFlags;

          const commands = getExecutableWrittenConfigsMethods(
            project,
            ctfMap,
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

          return commands[subcommand](filteredSkillFlags);
        })
    )
  );
}
