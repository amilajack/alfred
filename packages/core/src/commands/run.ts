import { ProjectInterface } from '@alfred/types';
import { getProjectSubcommands, getSkillInterfaceForSubcommand } from '.';
import { serialPromises } from '@alfred/helpers';

/**
 * Run an alfred subcommand given an alfred config
 */
export default async function run(
  project: ProjectInterface,
  subcommand: string,
  skillFlags: Array<string> = []
): Promise<void> {
  const { config } = project;
  const { targets } = project;

  // Validate that “start” subcommand should only work for apps
  // @HACK @REFACTOR This validation logic should be handled by the @alfred/interface-start interface
  if (subcommand === 'start') {
    const hasAppTarget = targets.some(target => target.project === 'app');
    if (!hasAppTarget) {
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

  const tasks = project.targets.map(target => async (): Promise<void> => {
    const skillInterface = getSkillInterfaceForSubcommand(skillMap, subcommand);

    if (!skillInterface.runForAllTargets) {
      if (commandWasExceuted) {
        return;
      }
      commandWasExceuted = true;
    }

    const filteredSkillFlags = skillInterface.handleFlags
      ? skillInterface.handleFlags(skillFlags, {
          target,
          config
        })
      : skillFlags;

    if (config.showConfigs) {
      await project.writeConfigsFromSkillMap(skillMap);
    }

    const commands = getProjectSubcommands(project, skillMap, target);
    if (!(subcommand in commands)) {
      throw new Error(
        `Subcommand "${subcommand}" is not supported by the skills you have installed`
      );
    }

    return commands[subcommand](filteredSkillFlags);
  });

  // @HACK Parcel doesn't work with concurrent builds. This is a temporary workaround
  if (subcommand === 'build') {
    await serialPromises(tasks);
  } else {
    await Promise.all(tasks.map(task => task()));
  }

  project.emit('afterRun', {
    subcommand,
    flags: skillFlags
  });
}
