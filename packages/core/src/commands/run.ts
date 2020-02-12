import { ProjectInterface } from '@alfred/types';
import { getProjectSubcommands, getSkillInterfaceForSubcommand } from '.';

/**
 * Run an alfred subcommand given an alfred config
 */
export default async function run(
  project: ProjectInterface,
  subcommand: string,
  skillFlags: Array<string> = []
): Promise<void> {
  const { config } = project;
  const { interfaceStates } = project;

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

  project.emit('beforeRun', {
    subcommand,
    flags: skillFlags
  });

  let commandWasExceuted = false;

  const skillMap = await project.getSkillMap();

  await Promise.all(
    project.interfaceStates.map(async interfaceState => {
      const skillInterface = getSkillInterfaceForSubcommand(
        skillMap,
        subcommand
      );

      if (!skillInterface.runForAllTargets) {
        if (commandWasExceuted) {
          return;
        }
        commandWasExceuted = true;
      }

      const filteredSkillFlags = skillInterface.handleFlags
        ? skillInterface.handleFlags(skillFlags, {
            interfaceState,
            config
          })
        : skillFlags;

      if (config.showConfigs) {
        await project.writeConfigsFromSkillMap(skillMap);
      }

      const commands = getProjectSubcommands(project, skillMap, interfaceState);
      if (!(subcommand in commands)) {
        throw new Error(
          `Subcommand "${subcommand}" is not supported by the skills you have installed`
        );
      }

      return commands[subcommand](filteredSkillFlags);
    })
  );

  project.emit('afterRun', {
    subcommand,
    flags: skillFlags
  });
}
