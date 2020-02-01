import { ProjectInterface } from '@alfred/types';
import {
  getExecutableWrittenConfigsMethods,
  getInterfaceForSubcommand
} from '.';
import { getInterfaceStatesFromProject } from '../interface';

/**
 * Run an alfred subcommand given an alfred config
 */
export default async function run(
  project: ProjectInterface,
  subcommand: string,
  skillFlags: Array<string> = []
): Promise<void> {
  const { config } = project;

  // @HACK This is not a very elegant solution.
  // @HACK @REFACTOR Certain subcommands do not rely on state (lint, test, etc). These
  //                 subcommands are run only once
  const interfaceStates = getInterfaceStatesFromProject(project);
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

  await Promise.all(
    interfaceStates.map(interfaceState =>
      project
        .skillMapFromInterfaceState(interfaceState)
        .then(skillMap =>
          config.showConfigs
            ? project.writeConfigsFromSkillMap(skillMap)
            : skillMap
        )
        .then(skillMap => {
          const subcommandInterface = getInterfaceForSubcommand(
            skillMap,
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
            skillMap,
            interfaceState
          );

          if (!subcommandInterface.runForAllTargets) {
            if (commandWasExceuted) {
              return;
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
