/* eslint import/no-dynamic-require: off */
import { UnresolvedInterfaces, ResolvedInterfaces } from '@alfred/types';

export function normalizeInterfacesOfSkill(
  interfaces: UnresolvedInterfaces | ResolvedInterfaces
): ResolvedInterfaces {
  if (!interfaces) return [];
  // `interfaces` is an array
  if (Array.isArray(interfaces)) {
    // @HACK Check if the array is alread formatted with this function by
    //       checking if name property exists
    if (
      interfaces[0] &&
      Array.isArray(interfaces[0]) &&
      'name' in interfaces[0]
    ) {
      return interfaces as ResolvedInterfaces;
    }
    return (interfaces as UnresolvedInterfaces).map(skillInterface => {
      if (typeof skillInterface === 'string') {
        return {
          name: skillInterface,
          module: require(skillInterface)
        };
      }
      if (Array.isArray(skillInterface)) {
        if (skillInterface.length !== 2) {
          throw new Error(
            'Interface tuple config must have exactly two elements'
          );
        }
        const [name, config] = skillInterface;
        return {
          name,
          module: require(name),
          config
        };
      }
      if (typeof skillInterface === 'object') {
        return skillInterface;
      }
      throw new Error(
        `Interface config must be either an array or a string. Received ${skillInterface}`
      );
    });
  }
  throw new Error(
    `.interfaces property must be an array of skill interfaces. Received ${JSON.stringify(
      interfaces
    )}`
  );
}
