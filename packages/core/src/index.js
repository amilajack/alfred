import lodash from 'lodash';
import path from 'path';
import rimraf from 'rimraf';
import fs from 'fs';
import childProcess from 'child_process';
import { getProjectRoot } from '@alfredpkg/cli/lib/helpers/CLI';
import jestCtf from '@alfredpkg/skill-jest';
import babel from '@alfredpkg/skill-babel';
import webpack from '@alfredpkg/skill-webpack';
import eslint from '@alfredpkg/skill-eslint';
import react from '@alfredpkg/skill-react';
import prettier from '@alfredpkg/skill-prettier';
import rollup from '@alfredpkg/skill-rollup';
import lodashCtf from '@alfredpkg/skill-lodash';
import pkgUp from 'pkg-up';

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

export type InterfaceInputType = Array<
  string | [string, { [x: string]: string }]
>;
export type InterfaceType = Array<{
  name: string,
  module: Object
}>;

export function normalizeInterfacesOfSkill(
  interfaces: InterfaceState
): InterfaceType {
  if (!interfaces) return [];
  // `interfaces` is an array
  if (Array.isArray(interfaces)) {
    // @HACK Check if the array is alread formatted with this function by
    //       checking if name property exists
    if (interfaces[0].name) {
      return interfaces;
    }
    return interfaces.map(e => {
      if (typeof e === 'string') {
        return {
          name: e,
          module: require(e), // eslint-disable-line
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
          module: require(name), // eslint-disable-line
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
  config: configType
};

type UsingInterface = {|
  interfaces: InterfaceInputType,
  subcommand: string,
  hooks: {
    call: (
      fileConfigPath: string,
      config: configFileType,
      alfredConfig: Object,
      state: InterfaceState,
      subcommand: string
    ) => string,
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
  configFiles: Array<configFileType>,
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
      throw new Error(`Unsupported environment name "${envName}"`);
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

  const { bin } = require(pkgJsonPath); // eslint-disable-line
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

const configsBasePath = path.join(getProjectRoot(), '.configs');

export function getConfigPathByConfigName(
  configName: string,
  configFiles: Array<configFileType>
) {
  const config = configFiles.find(e => e.name === configName);
  if (!config) throw new Error(`Cannot find config by name "${configName}"`);
  return config.path;
}

type CtfHelpers = {
  findConfig: (configName: string) => configType,
  addDependencies: ({ [x: string]: string }) => { [x: string]: string },
  addDevDependencies: ({ [x: string]: string }) => { [x: string]: string },
  extendConfig: (x: string) => CtfNode,
  replaceConfig: (x: string, configReplacement: configType) => CtfNode
};

const AddCtfHelpers: CtfHelpers = {
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
    const mergedConfigFile = lodash.merge({}, foundConfig, {
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
export default function CTF(
  ctfs: Array<CtfNode>,
  alfredConfig: Object,
  interfaceState: InterfaceState
): CtfMap {
  const map: CtfMap = new Map();

  ctfs.forEach(ctfNode => {
    const ctfWithHelpers = {
      ...ctfNode,
      ...AddCtfHelpers
    };
    map.set(ctfNode.name, ctfWithHelpers);
  });

  map.forEach(ctf => {
    Object.entries(ctf.ctfs || {}).forEach(([ctfName, ctfFn]) => {
      const correspondingCtfNode = map.get(ctfName);
      if (correspondingCtfNode) {
        map.set(
          ctfName,
          ctfFn(correspondingCtfNode, map, { alfredConfig, ...interfaceState })
        );
      }
    });
    // eslint-disable-next-line
    ctf.interfaces = normalizeInterfacesOfSkill(ctf.interfaces);
  });

  return map;
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

/**
 * Delete .configs dir
 */
export function deleteConfigs(): Promise<void> {
  if (fs.existsSync(configsBasePath)) {
    return new Promise(resolve => {
      rimraf(configsBasePath, () => {
        resolve();
      });
    });
  }
  return Promise.resolve();
}

/**
 * Write configs to a './.configs' directory
 */
export async function writeConfigsFromCtf(ctf: CtfMap) {
  await deleteConfigs();

  // Create a new .configs dir and write the configs
  const configs = Array.from(ctf.values())
    .map(ctfNode => ctfNode.configFiles || [])
    .reduce((p, c) => [...p, ...c], []);
  await fs.promises.mkdir(configsBasePath);
  await Promise.all(
    configs.map(config => {
      const filePath = path.join(configsBasePath, config.path);
      const convertedConfig =
        typeof config === 'string' ? config : JSON.stringify(config.config);
      return fs.promises.writeFile(filePath, convertedConfig);
    })
  );
}

export function addSubCommandsToCtfNodes(ctf: CtfMap): CtfMap {
  ctf.forEach(ctfNode => {
    const subcommands = ctfNode.interfaces.map(e => require(e.name).subcommand); // eslint-disable-line
    ctfNode.subcommands = subcommands; // eslint-disable-line
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
  return childProcess.execSync(cmd, { stdio: [0, 1, 2] });
}

export function getInterfaceForSubcommand(ctf: CtfMap, subcommand: string) {
  const interfaceForSubcommand = Array.from(ctf.values())
    .filter(
      ctfNode =>
        ctfNode.hooks && ctfNode.interfaces && ctfNode.interfaces.length
    )
    .reduce((arr, ctfNode) => arr.concat(ctfNode.interfaces.map(e => require(e.name))), []) // eslint-disable-line
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
  state: InterfaceState
) {
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
        const { subcommand } = require(e.name); // eslint-disable-line
        return {
          fn: alfredConfig =>
            // @TODO: Pass configFiles, ctf, alfredConfig, and state as an object to .call()
            ctfNode.hooks.call(
              configFiles,
              ctf,
              alfredConfig,
              state,
              subcommand
            ),
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
