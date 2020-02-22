import {
  ProjectInterface,
  SkillMap,
  Target,
  ExecutableSkillMethods,
  RunEvent,
  SubcommandFn,
  RunForEachEvent
} from '@alfred/types';
import { getSubcommandTasksMap } from '../task';
import { parseFlags } from '@alfred/helpers';

export function getSubcommandMap(
  project: ProjectInterface,
  skillMap: SkillMap
): ExecutableSkillMethods {
  const skills = Array.from(skillMap.values());
  const subcommandTaskMap = getSubcommandTasksMap(skillMap);
  const subcommandMapEntries = Array.from(subcommandTaskMap.entries()).map(
    ([subcommand, task]): [string, SubcommandFn] => {
      return [
        subcommand,
        // Keep this function async to normalize all run call fn's to promises
        async (flags: string[] = [], target?: Target): Promise<void> => {
          const event: RunEvent = {
            subcommand,
            parsedFlags: parseFlags(flags),
            flags
          };
          const skill = task.resolveSkill(skills, target);
          if (
            (task.runForEachTarget && !target) ||
            (!task.runForEachTarget && target)
          ) {
            throw new Error(
              'Target and runForEachTarget must both be defined together'
            );
          }
          if (task.runForEachTarget && target) {
            (event as RunForEachEvent).target = target;
          }
          return skill.hooks.run?.({
            event,
            project,
            config: project.config,
            targets: project.targets,
            skill,
            skillMap
          });
        }
      ];
    }
  );

  return new Map<string, SubcommandFn>(subcommandMapEntries);
}
