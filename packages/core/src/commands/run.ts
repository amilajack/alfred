import { ProjectInterface, SkillTaskModule, RunEvent } from '@alfred/types';
import { getSubcommandMap, getOutputForTarget } from '.';
import { parseFlags, serialPromises } from '@alfred/helpers';
import { getSubcommandTasksMap } from '../task';

/**
 * Run an alfred subcommand given an alfred config
 */
export default async function run(
  project: ProjectInterface,
  subcommand: string,
  skillFlags: Array<string> = []
): Promise<void> {
  const { targets } = project;

  // Validate that “start” subcommand should only work for apps
  // @HACK @REFACTOR This validation logic should be handled by the @alfred/task-start task
  if (subcommand === 'start') {
    const hasAppTarget = targets.some((target) => target.project === 'app');
    if (!hasAppTarget) {
      throw new Error(
        'The “start” subcommand can only be used with app project types'
      );
    }
  }

  const parsedFlags = parseFlags(skillFlags);
  const output = project.targets.map((target) =>
    getOutputForTarget(target, project.root)
  );
  const beforeRunEvent: RunEvent = {
    subcommand,
    flags: skillFlags,
    parsedFlags,
    output,
  };
  await project.emitAsync('beforeRun', beforeRunEvent);

  const skillMap = await project.getSkillMap();

  const subcommandMap = getSubcommandMap(project, skillMap);
  const subcommandRunFn = subcommandMap.get(subcommand);
  if (!subcommandRunFn) {
    throw new Error(`subcommand ${subcommand} does not exist in project`);
  }

  const subcommandTask = getSubcommandTasksMap(skillMap).get(
    subcommand
  ) as SkillTaskModule;

  if (subcommandTask.runForEachTarget) {
    const tasks = project.targets.map((target) => (): Promise<void> =>
      subcommandRunFn(skillFlags, target)
    );
    // @HACK Parcel doesn't work with concurrent builds. This is a temporary workaround
    if (subcommand === 'build') {
      await serialPromises(tasks);
    } else {
      await Promise.all(tasks.map((task) => task()));
    }
  } else {
    await subcommandRunFn(skillFlags);
  }

  const afterRunEvent: RunEvent = {
    subcommand,
    flags: skillFlags,
    parsedFlags,
    output,
  };
  await project.emitAsync('afterRun', afterRunEvent);
}
