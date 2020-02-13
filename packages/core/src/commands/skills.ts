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
    skill.interfaces.forEach(resultInterface => {
      subCommandDict.set(resultInterface.module.subcommand, resultInterface);
      if (subCommandAndSkills.has(resultInterface.module.subcommand)) {
        const set = subCommandAndSkills.get(resultInterface.module.subcommand);
        if (set) {
          set.add(skill.name);
          subCommandAndSkills.set(resultInterface.module.subcommand, set);
        }
      } else {
        subCommandAndSkills.set(
          resultInterface.module.subcommand,
          new Set([skill.name])
        );
      }
    });
  });

  return { subCommandAndSkills, subCommandDict };
}
