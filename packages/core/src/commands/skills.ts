import {
  ProjectInterface,
  SkillsList,
  SkillsForSubCommand,
  SubCommandDict
} from '@alfred/types';
import { getInterfaceStatesFromProject } from '../interface';

export default async function skills(
  project: ProjectInterface
): Promise<SkillsList> {
  const interfaceStateSkills = await Promise.all(
    getInterfaceStatesFromProject(project).map(interfaceState =>
      project
        .getSkillMapFromInterfaceState(interfaceState)
        .then(skillMap =>
          Array.from(skillMap.values()).filter(
            skillNode =>
              skillNode.hooks &&
              skillNode.interfaces &&
              skillNode.interfaces.length
          )
        )
    )
  );

  const subCommandAndSkills: SkillsForSubCommand = new Map();
  const subCommandDict: SubCommandDict = new Map();

  interfaceStateSkills.forEach(interfaceStateSkill => {
    interfaceStateSkill.forEach(result => {
      result.interfaces.forEach(resultInterface => {
        subCommandDict.set(resultInterface.module.subcommand, resultInterface);
        if (subCommandAndSkills.has(resultInterface.module.subcommand)) {
          const set = subCommandAndSkills.get(
            resultInterface.module.subcommand
          );
          if (set) {
            set.add(result.name);
            subCommandAndSkills.set(resultInterface.module.subcommand, set);
          }
        } else {
          subCommandAndSkills.set(
            resultInterface.module.subcommand,
            new Set([result.name])
          );
        }
      });
    });
  });

  return { subCommandAndSkills, subCommandDict };
}
