/* eslint import/no-dynamic-require: off */
import { UnresolvedInterfaces, ResolvedInterfaces } from '@alfred/types';

export function normalizeInterfacesOfSkill(
  interfaces: UnresolvedInterfaces
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
    return interfaces.map(skillInterface => {
      if (typeof skillInterface === 'string') {
        const requiredModule = require(skillInterface);
        return {
          name: skillInterface,
          module: requiredModule.default || requiredModule,
          config: {}
        };
      }
      if (Array.isArray(skillInterface)) {
        if (skillInterface.length !== 2) {
          throw new Error(
            'Interface tuple config must have exactly two elements'
          );
        }
        const [name, config] = skillInterface;
        const requiredModule = require(name);
        return {
          name,
          module: requiredModule.default || requiredModule,
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
