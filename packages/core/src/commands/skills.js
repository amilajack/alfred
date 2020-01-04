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

  const map: Map<string, Set<string>> = new Map();
  const subcommandDict: Map<string, Object> = new Map();

  interfaceStateCtfs.forEach(interfaceStateCtf => {
    interfaceStateCtf.forEach(result => {
      result.interfaces.forEach(e => {
        subcommandDict.set(e.module.subcommand, e);
        if (map.has(e.module.subcommand)) {
          const set = map.get(e.module.subcommand);
          if (set) {
            set.add(result.name);
            map.set(e.module.subcommand, set);
          }
        } else {
          map.set(e.module.subcommand, new Set([result.name]));
        }
      });
    });
  });

  return { map, subcommandDict };
}
