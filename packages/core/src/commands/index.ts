import path from 'path';
import {
  ProjectInterface,
  SkillMap,
  Target,
  ExecutableSkillMethods,
  RunEvent,
  SubcommandFn,
  RunForEachTargetEvent
} from '@alfred/types';
import { getSubcommandTasksMap } from '../task';
import { parseFlags, mapEnvToShortName } from '@alfred/helpers';

export function getOutputForTarget(target: Target, root: string): string {
  const { platform, env, project: projectEnum } = target;
  const envShortName = mapEnvToShortName(env);
  return path.join(
    root,
    'targets',
    [projectEnum, platform, envShortName].join('.')
  );
}

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
          if (
            (task.runForEachTarget && !target) ||
            (!task.runForEachTarget && target)
          ) {
            throw new Error(
              'Target and runForEachTarget must both be defined together'
            );
          }
          const baseEvent = {
            subcommand,
            parsedFlags: parseFlags(flags),
            flags
          };
          const event: RunEvent | RunForEachTargetEvent =
            task.runForEachTarget && target
              ? {
                  ...baseEvent,
                  target,
                  output: getOutputForTarget(target, project.root)
                }
              : {
                  ...baseEvent,
                  output: project.targets.map(target =>
                    getOutputForTarget(target, project.root)
                  )
                };
          const skill = task.resolveSkill(skills, target);
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
