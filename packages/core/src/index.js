/* eslint import/no-dynamic-require: off */
import path from 'path';
import childProcess from 'child_process';
import jestCtf from '@alfredpkg/skill-jest';
import babel from '@alfredpkg/skill-babel';
import webpack from '@alfredpkg/skill-webpack';
import eslint from '@alfredpkg/skill-eslint';
import react from '@alfredpkg/skill-react';
import prettier from '@alfredpkg/skill-prettier';
import rollup from '@alfredpkg/skill-rollup';
import lodashCtf from '@alfredpkg/skill-lodash';
import mergeConfigs from '@alfredpkg/merge-configs';
import pkgUp from 'pkg-up';
import lodash from 'lodash';
import topsort from 'toposort';

import type { ConfigType } from './config';

export type AlfredConfig = {
  extends?: Array<string> | Array<[string, { [x: string]: any }]> | string,
  npmClient: 'npm' | 'yarn',
  skills: Array<ConfigType>,
  root: string,
  showConfigs: boolean
};

export { default as Config, loadConfig, writeConfig } from './config';

// All the possible interface states
export const INTERFACE_STATES = [
  {
    projectType: 'app',
    target: 'browser',
    env: 'production'
  },
  {
    projectType: 'app',
    target: 'node',
    env: 'production'
  },
  {
    projectType: 'lib',
    target: 'browser',
    env: 'production'
  },
  {
    projectType: 'app',
    target: 'node',
    env: 'production'
  },
  {
    projectType: 'app',
    target: 'browser',
    env: 'development'
  },
  {
    projectType: 'app',
    target: 'node',
    env: 'development'
  },
  {
    projectType: 'lib',
    target: 'browser',
    env: 'development'
  },
  {
    projectType: 'app',
    target: 'node',
    env: 'development'
  }
];

export const CORE_CTFS = {
  babel,
  webpack,
  eslint,
  prettier,
  jest: jestCtf,
  react,
  rollup,
  lodash: lodashCtf
};

// @TODO send the information to a crash reporting service (like sentry.io)
process.on('unhandledRejection', err => {
  throw err;
});

export type InterfaceState = {
  // Flag name and argument types
  env: 'production' | 'development' | 'test',
  // All the supported targets a `build` skill should build
  target: 'browser' | 'node' | 'electron' | 'react-native',
  // Project type
  projectType: 'lib' | 'app'
};

export type RawInterfaceInputType = Array<
  string | [string, { [x: string]: string }]
>;
export type InterfaceInputType = Array<[string, { [x: string]: string }]>;
export type NormalizedInterfacesType = Array<{
  name: string,
  module: module
}>;

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

export type configType =
  | string
  | {
      [x: string]: any
    };

export type configFileType = {
  // The "friendly name" of a file. This is the name that
  // other CTFs will refer to config file by.
  name: string,
  // The relative path of the file the config should be written to
  path: string,
  // The value of the config
  config: configType,
  // The type of the config file. Defaults to 'json'
  fileType: 'module' | 'string' | 'json',
  // Allow the config to be written to user's `./configs` directory
  write: boolean
};

type UsingInterface = {|
  interfaces: InterfaceInputType,
  subcommand: string,
  hooks: {
    call: ({
      configFiles: Array<configFileType>,
      alfredConfig: AlfredConfig,
      interfaceState: InterfaceState,
      subcommand: string,
      skillConfig: any
    }) => string,
    install?: () => void
  }
|};

// @flow
type RequiredCtfNodeParams = {|
  name: string,
  dependencies: {
    [x: string]: any
  },
  devDependencies: {
    [x: string]: any
  },
  description: string,
  supports?: {
    // Flag name and argument types
    env: Array<'production' | 'development' | 'test'>,
    // All the supported targets a `build` skill should build
    targets: Array<'browser' | 'node' | 'electron' | 'react-native'>,
    // Project type
    projectTypes: Array<'lib' | 'app'>
  },
  subcommands?: Array<string>,
  configFiles: Array<configFileType>,
  interfaces: InterfaceInputType,
  hooks: {
    call: ({
      configFiles: Array<configFileType>,
      // eslint-disable-next-line no-use-before-define
      ctf: CtfMap,
      alfredConfig: AlfredConfig,
      interfaceState: InterfaceState,
      subcommand: string,
      flags: Array<string>,
      skillConfig: any
    }) => Promise<void>
  },
  ctfs: {
    [x: string]: (
      RequiredCtfNodeParams,
      Map<string, RequiredCtfNodeParams>
    ) => RequiredCtfNodeParams
  }
|};

export type CtfNode =
  | RequiredCtfNodeParams
  | {| ...UsingInterface, ...RequiredCtfNodeParams |};

export type CtfMap = Map<string, CtfNode>;

export function getConfigByConfigName(
  configName: string,
  configFiles: Array<configFileType>
) {
  const config = configFiles.find(e => e.name === configName);
  if (!config) throw new Error(`Cannot find config by name "${configName}"`);
  return config;
}

/**
 * Map the environment name to a short name, which is one of ['dev', 'prod', 'test']
 * @TODO: Should be moved to CLI
 */

export function mapEnvToShortName(envName: string): string {
  switch (envName) {
    case 'production': {
      return 'prod';
    }
    case 'development': {
      return 'dev';
    }
    case 'test': {
      return 'test';
    }
    default: {
      throw new Error(`Unsupported environment "${envName}"`);
    }
  }
}

export function mapShortNameEnvToLongName(envName: string): string {
  switch (envName) {
    case 'prod': {
      return 'production';
    }
    case 'dev': {
      return 'development';
    }
    default: {
      throw new Error(`Unsupported short name environment "${envName}"`);
    }
  }
}

/**
 * Get the name of the package JSON
 * @param {string} pkgName The name of the package
 * @param {string} binName The property of the bin object that we want
 */
export async function getPkgBinPath(pkgName: string, binName: string) {
  const pkgPath = require.resolve(pkgName);
  const pkgJsonPath = await pkgUp(pkgPath);

  const { bin } = require(pkgJsonPath);
  if (!bin) {
    throw new Error(
      `Module "${pkgName}" does not have a binary because it does not have a "bin" property in it's package.json`
    );
  }

  return path.join(
    path.dirname(pkgJsonPath),
    typeof bin === 'string' ? bin : bin[binName]
  );
}

export function getConfigsBasePath(projectRoot: string): string {
  return path.join(projectRoot, '.configs');
}

export function getConfigPathByConfigName(
  configName: string,
  configFiles: Array<configFileType>
) {
  const config = configFiles.find(e => e.name === configName);
  if (!config) throw new Error(`Cannot find config by name "${configName}"`);
  return config.path;
}

type CtfHelpers = {
  findConfig: (configName: string) => configFileType,
  addDependencies: ({ [x: string]: string }) => { [x: string]: string },
  addDevDependencies: ({ [x: string]: string }) => { [x: string]: string },
  extendConfig: (x: string) => CtfNode,
  replaceConfig: (x: string, configReplacement: configType) => CtfNode
};

export const AddCtfHelpers: CtfHelpers = {
  findConfig(configName: string) {
    const config = this.configFiles.find(
      configFile => configFile.name === configName
    );
    if (!config) {
      throw new Error(`Cannot find config with name "${configName}"`);
    }
    return config;
  },
  extendConfig(
    configName: string,
    configExtension: { [x: string]: string } = {}
  ): CtfNode {
    const foundConfig = this.findConfig(configName);
    const mergedConfigFile = mergeConfigs({}, foundConfig, {
      config: configExtension
    });
    const configFiles = this.configFiles.map(configFile =>
      configFile.name === configName ? mergedConfigFile : configFile
    );
    return lodash.merge({}, this, {
      configFiles
    });
  },
  replaceConfig(configName: string, configReplacement: configType) {
    const configFiles = this.configFiles.map(configFile =>
      configFile.name === configName ? configReplacement : configFile
    );
    return {
      ...this,
      configFiles
    };
  },
  addDependencies(dependencies) {
    return lodash.merge({}, this, {
      dependencies
    });
  },
  addDevDependencies(devDependencies) {
    return lodash.merge({}, this, {
      devDependencies
    });
  }
};

export function validateCtf(ctf: CtfMap, interfaceState: InterfaceState) {
  ctf.forEach(ctfNode => {
    if (ctfNode && ctfNode.supports) {
      const supports = {
        env: ctfNode.supports.env.includes(interfaceState.env),
        target: ctfNode.supports.targets.includes(interfaceState.target),
        projectType: ctfNode.supports.projectTypes.includes(
          interfaceState.projectType
        )
      };
      const { env, target, projectType } = supports;
      const isSupported = env && target && projectType;

      if (!isSupported) {
        throw new Error(
          `The "${ctfNode.name}" skill, which supports ${JSON.stringify(
            ctfNode.supports
          )}}, does not support the current environment, project type, or target, which are ${JSON.stringify(
            interfaceState
          )}`
        );
      }
    }
  });
}

/**
 * Topologically sort the CTFs
 */
export function topsortCtfs(ctfs: CtfMap): Array<string> {
  const topsortEntries = [];
  const ctfNodeNames = new Set(ctfs.keys());

  ctfs.forEach(ctfNode => {
    if (ctfNode.ctfs) {
      Object.keys(ctfNode.ctfs).forEach(ctfFnName => {
        if (ctfNodeNames.has(ctfFnName)) {
          topsortEntries.push([ctfNode.name, ctfFnName]);
        }
      });
    }
  });

  const sortedCtfNames = topsort(topsortEntries);
  ctfs.forEach(e => {
    if (!sortedCtfNames.includes(e.name)) {
      sortedCtfNames.push(e.name);
    }
  });

  return sortedCtfNames;
}

export function callCtfFnsInOrder(
  ctf: CtfMap,
  alfredConfig: AlfredConfig,
  interfaceState: InterfaceState
) {
  const ordered = topsortCtfs(ctf);
  // All the ctfs Fns from other ctfNodes that transform each ctfNode
  const selfTransforms = new Map(topsortCtfs(ctf).map(e => [e, []]));

  ctf.forEach(ctfNode => {
    Object.entries(ctfNode.ctfs || {}).forEach(([ctfName, ctfFn]) => {
      if (ctf.has(ctfName)) {
        const fn = () => {
          const correspondingCtfNode = ctf.get(ctfName);
          ctf.set(
            ctfName,
            ctfFn(correspondingCtfNode, ctf, {
              alfredConfig,
              ...interfaceState
            })
          );
        };
        const ctfSelfTransforms = selfTransforms.get(ctfName);
        ctfSelfTransforms.push(fn);
        selfTransforms.set(ctfName, ctfSelfTransforms);
      }
    });
  });

  const orderedSelfTransforms = ordered.map(e => selfTransforms.get(e));

  orderedSelfTransforms.forEach(selfTransform => {
    selfTransform.forEach(_selfTransform => {
      _selfTransform(ctf);
    });
  });

  return { ctf, orderedSelfTransforms };
}

export default function CTF(
  ctfs: Array<CtfNode>,
  alfredConfig: AlfredConfig,
  interfaceState: InterfaceState
): CtfMap {
  const ctf: CtfMap = new Map();

  ctfs.forEach(ctfNode => {
    const ctfWithHelpers = {
      ...ctfNode,
      ...AddCtfHelpers
    };
    ctfWithHelpers.interfaces = normalizeInterfacesOfSkill(
      ctfWithHelpers.interfaces
    );
    if (ctfWithHelpers.interfaces.length) {
      ctfWithHelpers.interfaces.forEach(e => {
        if (e.module.resolveSkill) {
          if (e.module.resolveSkill(ctfs, interfaceState) !== false) {
            ctf.set(ctfNode.name, ctfWithHelpers);
          }
        } else {
          ctf.set(ctfNode.name, ctfWithHelpers);
        }
      });
    } else {
      ctf.set(ctfNode.name, ctfWithHelpers);
    }
  });

  // validateCtf(ctf, interfaceState);

  return ctf;
}

/*
 * Intended to be used for testing purposes
 */
export function getConfigs(ctf: CtfMap): Array<configType> {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.configFiles || [])
    .reduce((p, c) => [...p, ...c], [])
    .map(e => e.config);
}

export function addSubCommandsToCtfNodes(ctf: CtfMap): CtfMap {
  ctf.forEach(ctfNode => {
    const subcommands = ctfNode.interfaces.map(e => require(e.name).subcommand);
    // eslint-disable-next-line no-param-reassign
    ctfNode.subcommands = subcommands;
  });
  return ctf;
}

/**
 * Intended to be used for testing purposes
 */
export function getDependencies(ctf: CtfMap): { [x: string]: string } {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.dependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
}

export function getDevDependencies(ctf: CtfMap): { [x: string]: string } {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.devDependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
}

export function execCommand(cmd: string) {
  return childProcess.execSync(cmd, { stdio: 'inherit' });
}

export function getInterfaceForSubcommand(ctf: CtfMap, subcommand: string) {
  const interfaceForSubcommand = Array.from(ctf.values())
    .filter(
      ctfNode =>
        ctfNode.hooks && ctfNode.interfaces && ctfNode.interfaces.length
    )
    .reduce(
      (arr, ctfNode) =>
        arr.concat(ctfNode.interfaces.map(e => require(e.name))),
      []
    )
    .find(ctfInterface => ctfInterface.subcommand === subcommand);

  if (!interfaceForSubcommand) {
    throw new Error(
      `The subcommand "${subcommand}" does not have an interface or the subcommand does not exist`
    );
  }

  return interfaceForSubcommand;
}

export function getExecuteWrittenConfigsMethods(
  ctf: CtfMap,
  interfaceState: InterfaceState,
  config: AlfredConfig
) {
  const configsBasePath = getConfigsBasePath(config.root);
  const skillsConfigMap: Map<string, ConfigType> = new Map(
    config.skills.map(([skillPkgName, skillConfig]) => [
      require(skillPkgName).name,
      skillConfig
    ])
  );

  return Array.from(ctf.values())
    .filter(
      ctfNode =>
        ctfNode.hooks && ctfNode.interfaces && ctfNode.interfaces.length
    )
    .reduce((prev, curr) => prev.concat(curr), [])
    .map(ctfNode => {
      const configFiles = ctfNode.configFiles.map(configFile => ({
        ...configFile,
        path: path.join(configsBasePath, configFile.path)
      }));
      return ctfNode.interfaces.map(e => {
        const { subcommand } = require(e.name);
        const skillConfig = skillsConfigMap.get(ctfNode.name);
        return {
          fn: (alfredConfig: AlfredConfig, flags: Array<string> = []) =>
            ctfNode.hooks.call({
              configFiles,
              ctf,
              alfredConfig,
              interfaceState,
              subcommand,
              flags,
              skillConfig
            }),
          // @HACK: If interfaces were defined, we could import the @alfredpkg/interface-*
          //        and use the `subcommand` property. This should be done after we have
          //        some interfaces to work with
          subcommand
        };
      });
    })
    .reduce((p, c) => p.concat(c), [])
    .reduce(
      (p, c) => ({
        ...p,
        [c.subcommand]: c.fn
      }),
      {}
    );
}
