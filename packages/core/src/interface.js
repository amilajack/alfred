/* eslint import/no-dynamic-require: off */
import path from 'path';
import fs from 'fs';
import { ENTRYPOINTS } from './entrypoints';
import Config from './config';
import type {
  InterfaceState,
  RawInterfaceInputType,
  NormalizedInterfacesType
} from './types';

// All the possible interface states
// @TODO Also allow .ts entrypoints
// @TODO Allow the follow entrypoints:
// 'lib.electron.main.js',
// 'lib.electron.renderer.js',
// 'app.electron.main.js',
// 'app.electron.renderer.js',
// 'lib.react-native.js',
// 'app.react-native.js'
export const INTERFACE_STATES = [
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
  interfaces: RawInterfaceInputType
): NormalizedInterfacesType {
  if (!interfaces) return [];
  // `interfaces` is an array
  if (Array.isArray(interfaces)) {
    // @HACK Check if the array is alread formatted with this function by
    //       checking if name property exists
    if (interfaces[0] && interfaces[0].name) {
      return interfaces;
    }
    return interfaces.map(e => {
      if (typeof e === 'string') {
        return {
          name: e,
          module: require(e)
        };
      }
      if (Array.isArray(e)) {
        if (e.length !== 2) {
          throw new Error(
            'Interface tuple config must have exactly two elements'
          );
        }
        const [name, config] = e;
        return {
          name,
          module: require(name),
          config
        };
      }
      throw new Error('Interface config must be either an array or a string');
    });
  }
  throw new Error(
    `".interfaces" property must be an array of strings or an array of arrays. Received "${interfaces}"`
  );
}

export function generateInterfaceStatesFromProject(
  config: Config
): Array<InterfaceState> {
  const envs = ['production', 'development', 'test'];
  // Default to development env if no config given
  const env = envs.includes(process.env.NODE_ENV)
    ? process.env.NODE_ENV
    : 'development';

  return ENTRYPOINTS.filter(e =>
    fs.existsSync(path.join(config.root, 'src', e))
  ).map(e => {
    const [projectType, target] = e.split('.');
    return {
      env,
      target,
      projectType
    };
  });
}
