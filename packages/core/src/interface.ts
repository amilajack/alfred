/* eslint import/no-dynamic-require: off */
import path from 'path';
import fs from 'fs';
import { ENTRYPOINTS } from './constants';
import {
  ProjectInterface,
  InterfaceState,
  UnresolvedInterfaces,
  ResolvedInterfaces,
  Env,
  ProjectEnum,
  Target
} from '@alfred/types';

// All the possible interface states
// @TODO Also allow .ts entrypoints
// @TODO Allow the follow entrypoints:
// 'lib.electron.main.js',
// 'lib.electron.renderer.js',
// 'app.electron.main.js',
// 'app.electron.renderer.js',
// 'lib.react-native.js',
// 'app.react-native.js'
export const INTERFACE_STATES: Array<InterfaceState> = [
  {
    projectType: 'app',
    target: 'browser',
    env: 'production'
  },
  {
    projectType: 'app',
    target: 'browser',
    env: 'development'
  },
  // @TODO
  // {
  //   projectType: 'app',
  //   target: 'node',
  //   env: 'production'
  // },
  // @TODO
  // {
  //   projectType: 'app',
  //   target: 'node',
  //   env: 'development'
  // },
  {
    projectType: 'lib',
    target: 'node',
    env: 'production'
  },
  {
    projectType: 'lib',
    target: 'node',
    env: 'development'
  },
  {
    projectType: 'lib',
    target: 'browser',
    env: 'production'
  },
  {
    projectType: 'lib',
    target: 'browser',
    env: 'development'
  }
];

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
    `".interfaces" property must be an array of strings or an array of arrays. Received "${interfaces}"`
  );
}

export function generateInterfaceStatesFromProject(
  project: ProjectInterface
): Array<InterfaceState> {
  const envs: Array<string> = ['production', 'development', 'test'];
  // Default to development env if no config given
  const env: Env = envs.includes(process.env.NODE_ENV || '')
    ? (process.env.NODE_ENV as Env)
    : 'development';

  return ENTRYPOINTS.filter(e =>
    fs.existsSync(path.join(project.root, 'src', e))
  ).map(e => {
    const [projectType, target] = e.split('.') as [ProjectEnum, Target];
    return {
      env,
      target,
      projectType
    };
  });
}