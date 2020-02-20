import {
  ProjectInterface,
  SkillsList,
  SkillsForSubCommand,
  SubCommandDict
} from '@alfred/types';

export default async function skills(
  project: ProjectInterface
): Promise<SkillsList> {
  const skillMap = await project.getSkillMap();

  const subCommandAndSkills: SkillsForSubCommand = new Map();
  const subCommandDict: SubCommandDict = new Map();

  skillMap.forEach(skill => {
    skill.tasks.forEach(resultTask => {
      subCommandDict.set(resultTask.module.subcommand, resultTask);
      if (subCommandAndSkills.has(resultTask.module.subcommand)) {
        const set = subCommandAndSkills.get(resultTask.module.subcommand);
        if (set) {
          set.add(skill.name);
          subCommandAndSkills.set(resultTask.module.subcommand, set);
        }
      } else {
        subCommandAndSkills.set(
          resultTask.module.subcommand,
          new Set([skill.name])
        );
      }
    });
  });

  return { subCommandAndSkills, subCommandDict };
}
