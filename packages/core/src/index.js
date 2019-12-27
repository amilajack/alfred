/* eslint import/no-dynamic-require: off */
import path from 'path';
import childProcess from 'child_process';
import jestCtf from '@alfred/skill-jest';
import babel from '@alfred/skill-babel';
import webpack from '@alfred/skill-webpack';
import eslint from '@alfred/skill-eslint';
import react from '@alfred/skill-react';
import prettier from '@alfred/skill-prettier';
import parcel from '@alfred/skill-parcel';
import rollup from '@alfred/skill-rollup';
import lodashCtf from '@alfred/skill-lodash';
import mergeConfigs from '@alfred/merge-configs';
import pkgUp from 'pkg-up';
import lodash from 'lodash';
import topsort from './topsort';
import type { AlfredConfig } from './types';

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

export { default as Config } from './config';

export const CORE_CTFS = {
  babel,
  webpack,
  parcel,
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
  const pkgJsonPath = await pkgUp({ cwd: pkgPath });

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
  // Check if the CTF's can be topsorted
  topsortCtfs(ctf);
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
  const skillsConfigMap: Map<string, configType> = new Map(
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
          // @HACK: If interfaces were defined, we could import the @alfred/interface-*
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

/**
 * Add skills to a given list of skills to ensure that the list has a complete set
 * of standard ctfs. Also remove skills that do not support the current interfaceState
 * @REFACTOR Share logic between this and CTF(). Much duplication here
 */
export function addMissingStdSkillsToCtf(
  ctf: CtfMap,
  alfredConfig: AlfredConfig,
  interfaceState: InterfaceState
): CtfMap {
  // Remove skills that do not support the current interfaceState
  const ctfNodesToBeRemoved = [];
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
        ctfNodesToBeRemoved.push(ctfNode.name);
      }
    }
  });

  ctfNodesToBeRemoved.forEach(ctfNodeName => {
    ctf.delete(ctfNodeName);
  });

  // Create a set of standard skills
  const stdCtf = new Map(
    Object.entries({
      lint: CORE_CTFS.eslint,
      format: CORE_CTFS.prettier,
      build: require('@alfred/interface-build').resolveSkill(
        Object.values(CORE_CTFS),
        interfaceState
      ),
      start: require('@alfred/interface-start').resolveSkill(
        Object.values(CORE_CTFS),
        interfaceState
      ),
      test: CORE_CTFS.jest
    })
  );

  ctf.forEach(ctfNode => {
    /* eslint no-param-reassign: off */
    ctfNode.interfaces = normalizeInterfacesOfSkill(ctfNode.interfaces);
  });

  const stdSubCommands: Set<string> = new Set(stdCtf.keys());
  // Create a set of subcommands that the given CTF has
  const ctfSubcommands: Set<string> = Array.from(ctf.values()).reduce(
    (prev, ctfNode) => {
      if (ctfNode.interfaces && ctfNode.interfaces.length) {
        ctfNode.interfaces.forEach(_interface => {
          const { subcommand } = _interface.module;
          prev.add(subcommand);
        });
      }
      return prev;
    },
    new Set()
  );

  stdSubCommands.forEach(stdSubCommand => {
    if (!ctfSubcommands.has(stdSubCommand)) {
      const stdCtfSkillToAdd = stdCtf.get(stdSubCommand);
      if (
        stdCtfSkillToAdd &&
        stdCtfSkillToAdd.interfaces &&
        stdCtfSkillToAdd.interfaces.length
      ) {
        stdCtfSkillToAdd.interfaces = normalizeInterfacesOfSkill(
          stdCtfSkillToAdd.interfaces
        );
      }
      ctf.set(stdCtfSkillToAdd.name, {
        ...stdCtfSkillToAdd,
        ...AddCtfHelpers
      });
    }
  });

  // Add all the CORE_CTF's without subcommands
  // @HACK
  if (!ctf.has('babel')) {
    ctf.set('babel', { ...CORE_CTFS.babel, ...AddCtfHelpers });
  }

  callCtfFnsInOrder(ctf, alfredConfig, interfaceState);
  validateCtf(ctf, interfaceState);

  return ctf;
}

export async function generateCtfFromConfig(
  alfredConfig: AlfredConfig,
  interfaceState: InterfaceState
): Promise<CtfMap> {
  // Generate the CTF
  const tmpCtf: CtfMap = new Map();
  const { skills = [] } = alfredConfig;
  skills.forEach(([skillPkgName, skillConfig]) => {
    // Add the skill config to the ctfNode
    const ctfNode = require(skillPkgName);
    ctfNode.config = skillConfig;
    if (ctfNode.configFiles) {
      ctfNode.configFiles = ctfNode.configFiles.map(configFile => ({
        ...configFile,
        config: mergeConfigs(
          {},
          configFile.config,
          // Only apply config if skill has only one config file
          ctfNode.configFiles.length === 1 ? skillConfig : {}
        )
      }));
    }
    tmpCtf.set(ctfNode.name, ctfNode);
  });

  const ctf = CTF(Array.from(tmpCtf.values()), alfredConfig, interfaceState);
  addMissingStdSkillsToCtf(ctf, alfredConfig, interfaceState);

  return ctf;
}

/**
 * Find all the dependencies that are different between two CTF's.
 * This is used to figure out which deps need to be installed by
 * finding which dependencies have changed in the package.json
 *
 * Find all the elements such that are (A ⩃ B) ⋂ B
 * where A is old ctf and B is new ctf
 */
export function diffCtfDeps(oldCtf: CtfMap, newCtf: CtfMap): Array<string> {
  const oldCtfMap: Map<string, string> = new Map(
    Object.entries(getDevDependencies(oldCtf))
  );
  const diffDeps = new Map();

  Object.entries(getDevDependencies(newCtf)).forEach(([dependency, semver]) => {
    if (oldCtfMap.has(dependency)) {
      if (oldCtfMap.get(dependency) !== semver) {
        throw new Error('Cannot resolve diff deps');
      }
    } else {
      diffDeps.set(dependency, semver);
    }
  });

  return Array.from(diffDeps.entries()).map(
    ([dependency, semver]) => `${dependency}@${semver}`
  );
}

export async function diffCtfDepsOfAllInterfaceStates(
  prevAlfredConfig: AlfredConfig,
  currAlfredConfig: AlfredConfig
): Array<string> {
  const stateWithDuplicateDeps = await Promise.all(
    INTERFACE_STATES.map(interfaceState =>
      Promise.all([
        generateCtfFromConfig(prevAlfredConfig, interfaceState),
        generateCtfFromConfig(currAlfredConfig, interfaceState)
      ])
    )
  );

  return Array.from(
    new Set(
      stateWithDuplicateDeps
        .map(([a, b]) => diffCtfDeps(a, b))
        .reduce((prev, curr) => prev.concat(curr), [])
    )
  );
}
