import {
  ProjectInterface,
  SkillsList,
  SkillsForSubCommand,
  SubCommandDict
} from '@alfred/types';
import { generateInterfaceStatesFromProject } from '../interface';
import { writeMissingDeps } from '.';

export default async function skills(
  project: ProjectInterface
): Promise<SkillsList> {
  await writeMissingDeps(project);

  const interfaceStateCtfs = await Promise.all(
    generateInterfaceStatesFromProject(project).map(interfaceState =>
      project
        .ctfFromInterfaceState(interfaceState)
        .then(ctf =>
          Array.from(ctf.values()).filter(
            ctfNode =>
              ctfNode.hooks && ctfNode.interfaces && ctfNode.interfaces.length
          )
        )
    )
  );

  const subCommandAndSkills: SkillsForSubCommand = new Map();
  const subCommandDict: SubCommandDict = new Map();

  interfaceStateCtfs.forEach(interfaceStateCtf => {
    interfaceStateCtf.forEach(result => {
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
