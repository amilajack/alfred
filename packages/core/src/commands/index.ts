/* eslint import/no-dynamic-require: off */
import {
  ProjectInterface,
  SkillMap,
  Target,
  ExecutableSkillMethods,
  RunEvent,
  SubcommandFn,
  RunForEachEvent
} from '@alfred/types';
import { getSubcommandInterfacesMap } from '../interface';

export function getSubcommandMap(
  project: ProjectInterface,
  skillMap: SkillMap
): ExecutableSkillMethods {
  const skills = Array.from(skillMap.values());
  const subcommandInterfaceMap = getSubcommandInterfacesMap(skillMap);
  const subcommandMapEntries = Array.from(subcommandInterfaceMap.entries()).map(
    ([subcommand, skillInterface]): [string, SubcommandFn] => {
      return [
        subcommand,
        // Keep this function async to normalize all run call fn's to promises
        async (flags: string[] = [], target?: Target): Promise<void> => {
          const event = {
            subcommand,
            flags
          } as RunEvent;
          const skill = skillInterface.resolveSkill(skills, target);
          if (
            (skillInterface.runForEachTarget && !target) ||
            (!skillInterface.runForEachTarget && target)
          ) {
            throw new Error(
              'Target and runForEachTarget must both be defined together'
            );
          }
          if (skillInterface.runForEachTarget && target) {
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
