import {
  UnresolvedTasks,
  ResolvedTasks,
  Skill,
  SkillTaskModule,
  SkillMap,
} from '@alfred/types';
import { CORE_TASKS } from './constants';
import { requireModule } from './helpers';

export function getSubcommandTasksMap(
  skillsOrSkillMap: Skill[] | SkillMap
): Map<string, SkillTaskModule> {
  const skills = Array.isArray(skillsOrSkillMap)
    ? skillsOrSkillMap
    : Array.from(skillsOrSkillMap.values());
  const subcommandTaskMap = new Map<string, SkillTaskModule>(CORE_TASKS);

  skills.forEach((skill: Skill) => {
    if (skill.tasks.length) {
      skill.tasks.forEach((task) => {
        subcommandTaskMap.set(task.module.subcommand, task.module);
      });
    }
  });

  return subcommandTaskMap;
}

export function normalizeTasksOfSkill(tasks: UnresolvedTasks): ResolvedTasks {
  if (!tasks) return [];
  // `tasks` is an array
  if (Array.isArray(tasks)) {
    // @HACK Check if the array is alread formatted with this function by
    //       checking if name property exists
    if (tasks[0] && Array.isArray(tasks[0]) && 'name' in tasks[0]) {
      return tasks as ResolvedTasks;
    }
    return tasks.map((task) => {
      if (typeof task === 'string') {
        const requiredModule = requireModule(task);
        return {
          name: task,
          module: requiredModule,
          config: {},
        };
      }
      if (Array.isArray(task)) {
        if (task.length !== 2) {
          throw new Error('Task tuple config must have exactly two elements');
        }
        const [name, config] = task;
        const requiredModule = requireModule(name);
        return {
          name,
          module: requiredModule,
          config,
        };
      }
      if (typeof task === 'object') {
        return task;
      }
      throw new Error(
        `Task config must be either an array or a string. Received ${task}`
      );
    });
  }
  throw new Error(
    `.tasks property must be an array of skill tasks. Received ${JSON.stringify(
      tasks
    )}`
  );
}
