import { generateCtfFromConfig } from '../ctf';
import { generateInterfaceStatesFromProject } from '../interface';
import {
  ProjectInterface,
  SkillsList,
  SkillsForSubCommand,
  SubCommandDict
} from '@alfred/types';

export default async function skills(
  project: ProjectInterface
): Promise<SkillsList> {
  const interfaceStateCtfs = await Promise.all(
    generateInterfaceStatesFromProject(project).map(interfaceState =>
      generateCtfFromConfig(project, project.config, interfaceState).then(ctf =>
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
      result.interfaces.forEach(e => {
        subCommandDict.set(e.module.subcommand, e);
        if (subCommandAndSkills.has(e.module.subcommand)) {
          const set = subCommandAndSkills.get(e.module.subcommand);
          if (set) {
            set.add(result.name);
            subCommandAndSkills.set(e.module.subcommand, set);
          }
        } else {
          subCommandAndSkills.set(e.module.subcommand, new Set([result.name]));
        }
      });
    });
  });

  return { subCommandAndSkills, subCommandDict };
}
