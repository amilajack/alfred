import { generateCtfFromConfig } from '../ctf';
import { generateInterfaceStatesFromProject } from '../interface';

export default async function skills(alfredConfig) {
  const interfaceStateCtfs = await Promise.all(
    generateInterfaceStatesFromProject(alfredConfig).map(interfaceState =>
      generateCtfFromConfig(alfredConfig, interfaceState).then(ctf =>
        Array.from(ctf.values()).filter(
          ctfNode =>
            ctfNode.hooks && ctfNode.interfaces && ctfNode.interfaces.length
        )
      )
    )
  );

  const subCommandAndSkills: Map<string, Set<string>> = new Map();
  const subCommandDict: Map<string, Object> = new Map();

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
