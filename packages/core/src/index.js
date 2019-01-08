import lodash from 'lodash';
import path from 'path';
import rimraf from 'rimraf';
import fs from 'fs';
import childProcess from 'child_process';
import jestCtf from '@alfredpkg/skill-jest';
import babel from '@alfredpkg/skill-babel';
import webpack from '@alfredpkg/skill-webpack';
import eslint from '@alfredpkg/skill-eslint';
import prettier from '@alfredpkg/skill-prettier';

export const CORE_CTFS = { babel, webpack, eslint, prettier, jest: jestCtf };

// @TODO send the information to a crash reporting service (like sentry.io)
process.on('unhandledRejection', err => {
  throw err;
});

export type configFileType = {
  // The "friendly name" of a file. This is the name that
  // other CTFs will refer to config file by.
  name: string,
  // The relative path of the file the config should be written to
  path: string,
  // The value of the config
  config:
    | string
    | {
        [x: string]: any
      }
};

type UsingInterface = {
  interface: string,
  hooks: {
    call: (fileConfigPath: string, config: configFileType) => string,
    install?: () => void
  }
};

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
  configName,
  configFiles: Array<configFileType>
) {
  const config = configFiles.find(e => e.name === configName);
  if (!config) throw new Error(`Cannot find config by name "${configName}"`);
  return config;
}

export function getConfigPathByConfigName(
  configName,
  configFiles: Array<configFileType>
) {
  const config = configFiles.find(e => e.name === configName);
  if (!config) throw new Error(`Cannot find config by name "${configName}"`);
  return config.path;
}

type CtfHelpers = {
  findConfig: (configName: string) => { [x: string]: string },
  addDependencies: ({ [x: string]: string }) => { [x: string]: string },
  addDevDependencies: ({ [x: string]: string }) => { [x: string]: string },
  extendConfig: (x: string) => CtfNode,
  replaceConfig: (x: string) => CtfNode
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
  replaceConfig(
    configName: string,
    configReplacement: { [x: string]: string } = {}
  ) {
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
export default function CTF(ctfs: Array<CtfNode>): CtfMap {
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
        map.set(ctfName, ctfFn(correspondingCtfNode, map));
      }
    });
  });

  return map;
}
/*
 * Intended to be used for testing purposes
 */
export function getConfigs(ctf: CtfMap): Array<{ [x: string]: any }> {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.configFiles)
    .reduce((p, c) => [...p, ...c], [])
    .map(e => e.config);
}
/**
 * Write configs to a './.configs' directory
 */
export async function writeConfigsFromCtf(ctf: CtfMap) {
  const configsBasePath = path.join(process.cwd(), '.configs');
  // Delete .configs dir
  await new Promise(resolve => {
    rimraf(configsBasePath, () => {
      resolve();
    });
  });
  // Create a new .configs dir and write the configs
  const configs = Array.from(ctf.values())
    .map(ctfNode => ctfNode.configFiles)
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
export function execCommand(installScript: string) {
  childProcess.execSync(installScript, { stdio: [0, 1, 2] });
}
export function getExecuteWrittenConfigsMethods(ctf: CtfMap) {
  const configsBasePath = path.join(process.cwd(), '.configs');
  return Array.from(ctf.values())
    .filter(
      ctfNode =>
        ctfNode.hooks && ctfNode.configFiles.length && ctfNode.interface
    )
    .map(ctfNode => {
      const configFiles = ctfNode.configFiles.map(configFile => ({
        ...configFile,
        path: path.join(configsBasePath, configFile.path)
      }));
      const { subcommand } = require(ctfNode.interface); // eslint-disable-line
      return {
        fn: () => {
          try {
            ctfNode.hooks.call(configFiles, ctf);
          } catch (e) {} // eslint-disable-line
        },
        // @HACK: If interfaces were defined, we could import the @alfredpkg/interface-*
        //        and use the `subcommand` property. This should be done after we have
        //        some interfaces to work with
        subcommand
      };
    })
    .reduce(
      (p, c) => ({
        ...p,
        [c.subcommand]: c.fn
      }),
      {}
    );
}
