/* eslint import/no-dynamic-require: off, @typescript-eslint/ban-ts-ignore: off */
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import npm from 'npm';
import formatPkg from 'format-package';
import lodash from 'lodash';
import { getConfigsBasePath } from '@alfred/helpers';
import mergeConfigs from '@alfred/merge-configs';
import {
  ConfigInterface,
  CtfMap,
  CtfNode,
  ProjectInterface,
  NpmClients,
  InterfaceState,
  ConfigWithResolvedSkills,
  ConfigWithUnresolvedInterfaces,
  ConfigFile,
  ProjectEnum,
  Target,
  CtfWithHelpers,
  Dependencies
} from '@alfred/types';
import topsort from './topsort';
import Config from './config';
import { normalizeInterfacesOfSkill, INTERFACE_STATES } from './interface';

const jestCtf = require('@alfred/skill-jest');
const babel = require('@alfred/skill-babel');
const webpack = require('@alfred/skill-webpack');
const eslint = require('@alfred/skill-eslint');
const react = require('@alfred/skill-react');
const prettier = require('@alfred/skill-prettier');
const parcel = require('@alfred/skill-parcel');
const rollup = require('@alfred/skill-rollup');
const lodashCtf = require('@alfred/skill-lodash');

type CORE_CTF =
  | 'babel'
  | 'webpack'
  | 'parcel'
  | 'eslint'
  | 'prettier'
  | 'jest'
  | 'react'
  | 'rollup'
  | 'lodash';

function addCtfHelpers(ctf: CtfNode): CtfWithHelpers {
  return {
    ...ctf,
    findConfig(configName: string): ConfigFile {
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
    ): CtfWithHelpers {
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
    replaceConfig(
      configName: string,
      configReplacement: ConfigFile
    ): CtfWithHelpers {
      const configFiles = this.configFiles.map(configFile =>
        configFile.name === configName ? configReplacement : configFile
      );
      return {
        ...this,
        configFiles
      };
    },
    addDependencies(dependencies: Dependencies): CtfWithHelpers {
      return lodash.merge({}, this, {
        dependencies
      });
    },
    addDevDependencies(devDependencies: Dependencies): CtfWithHelpers {
      return lodash.merge({}, this, {
        devDependencies
      });
    }
  };
}

function normalizeCtf(ctf: CtfNode): CtfWithHelpers {
  return {
    ...addCtfHelpers(ctf),
    interfaces: normalizeInterfacesOfSkill(ctf.interfaces)
  };
}

export const CORE_CTFS: { [ctf in CORE_CTF]: CtfWithHelpers } = {
  babel: normalizeCtf(babel),
  webpack: normalizeCtf(webpack),
  parcel: normalizeCtf(parcel),
  eslint: normalizeCtf(eslint),
  prettier: normalizeCtf(prettier),
  jest: normalizeCtf(jestCtf),
  react: normalizeCtf(react),
  rollup: normalizeCtf(rollup),
  lodash: normalizeCtf(lodashCtf)
};

// Examples
// 'lib.node.js',
// 'app.node.js',
// 'lib.browser.js',
// 'app.browser.js'
// etc...
export const ENTRYPOINTS = [
  'lib.node.js',
  'app.node.js',
  'lib.browser.js',
  'app.browser.js'
];

/**
 * Convert entrypoints to interface states
 */
export function entrypointsToInterfaceStates(
  entrypoints: Array<string>
): Array<InterfaceState> {
  return entrypoints.map(entrypoint => {
    const [projectType, target] = entrypoint.split('.') as [
      ProjectEnum,
      Target
    ];
    return { projectType, target, env: 'production' };
  });
}

/**
 * Write configs to a './.configs' directory
 */
export async function writeConfigsFromCtf(
  project: ProjectInterface,
  ctf: CtfMap
): Promise<CtfMap> {
  const { config } = project;
  if (!config.showConfigs) return ctf;
  // Create a .configs dir if it doesn't exist
  const configsBasePath = getConfigsBasePath(project.root);
  if (!fs.existsSync(configsBasePath)) {
    fs.mkdirSync(configsBasePath);
  }

  const ctfNodes: CtfNode[] = Array.from(ctf.values());

  await Promise.all(
    ctfNodes
      .filter(ctfNode => ctfNode.configFiles && ctfNode.configFiles.length)
      .flatMap(ctfNode => ctfNode.configFiles)
      .map(async configFile => {
        const filePath = path.join(configsBasePath, configFile.path);
        const stringifiedConfig =
          typeof configFile.config === 'string'
            ? configFile.config
            : await formatPkg(configFile.config);
        // Write sync to prevent data races when writing configs in parallel
        const normalizedJsonOrModule =
          configFile.configValue === 'module'
            ? `module.exports = ${stringifiedConfig};`
            : stringifiedConfig;
        fs.writeFileSync(filePath, normalizedJsonOrModule);
      })
  );

  return ctf;
}

/**
 * @TODO Account for `devDependencies` and `dependencies`
 * @TODO @REFACTOR Move to AlfredProject
 */
export async function installDeps(
  dependencies: Array<string> = [],
  npmClient: NpmClients = 'npm',
  project: ProjectInterface
): Promise<any> {
  const { root } = project;
  if (!dependencies.length) return Promise.resolve();

  switch (npmClient) {
    // Install dependencies with NPM, which is the default
    case 'npm': {
      return new Promise((resolve, reject) => {
        npm.load({ save: true }, err => {
          if (err) reject(err);

          npm.commands.install(dependencies, (_err, data) => {
            if (_err) reject(_err);
            resolve(data);
          });

          npm.on('log', console.log);
        });
      });
    }
    // Install dependencies with Yarn
    case 'yarn': {
      return childProcess.execSync(['yarn', 'add', ...dependencies].join(' '), {
        cwd: root,
        stdio: 'inherit'
      });
    }
    // Write the package to the package.json but do not install them. This is intended
    // to be used for end to end testing
    case 'writeOnly': {
      const { pkg } = project;
      const { dependencies: currentDependencies = {} } = pkg;
      const dependenciesAsObject = dependencies
        .map(dependency => {
          if (dependency[0] !== '@') {
            return dependency.split('@');
          }
          // A temporary hack that handles scoped npm packages. A proper solution would be
          // using a semver parser. Package names come in the following form: ['@a/b@1.2.3', 'a@latest', ...].
          // Temporarily remove the scope so we can split the package name
          const pkgWithoutScope = dependency.slice(1).split('@');
          // Then add it back
          return [`@${pkgWithoutScope[0]}`, pkgWithoutScope[1]];
        })
        .map(([p, c]) => ({ [p]: c }))
        .reduce((p, c) => ({ ...p, ...c }), {});
      const newDependencies = {
        ...currentDependencies,
        ...dependenciesAsObject
      };
      // @TODO @HACK @BUG This is an incorrect usage of the Config API
      return Config.writeToPkgJson(project.pkgPath, {
        dependencies: newDependencies
      });
    }
    default: {
      throw new Error('Unsupported npm client. Can only be "npm" or "yarn"');
    }
  }
}

/**
 * Topologically sort the CTFs
 */
export function topsortCtfs(ctfs: CtfMap): Array<string> {
  const topsortEntries: Array<[string, string]> = [];
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

type Transforms = Array<() => void>;
type OrderedCtfTransformsMap = Map<string, Transforms>;
type OrderedCtfTransforms = Array<Transforms>;

export function callCtfFnsInOrder(
  project: ProjectInterface,
  ctf: CtfMap,
  interfaceState: InterfaceState
): { ctf: CtfMap; orderedSelfTransforms: OrderedCtfTransforms } {
  const { config } = project;
  const topologicallyOrderedCtfs = topsortCtfs(ctf);
  // All the ctfs Fns from other ctfNodes that transform each ctfNode
  const selfTransforms: OrderedCtfTransformsMap = new Map(
    topsortCtfs(ctf).map(e => [e, []])
  );

  ctf.forEach(ctfNode => {
    Object.entries(ctfNode.ctfs || {}).forEach(([ctfName, ctfFn]) => {
      if (ctf.has(ctfName)) {
        const fn = (): void => {
          const correspondingCtfNode = ctf.get(ctfName) as CtfNode;
          ctf.set(
            ctfName,
            ctfFn(correspondingCtfNode, ctf, {
              project,
              config,
              ...interfaceState
            })
          );
        };
        selfTransforms.get(ctfName)?.push(fn);
      }
    });
  });

  const orderedSelfTransforms: OrderedCtfTransforms = topologicallyOrderedCtfs.map(
    e => selfTransforms.get(e) as Transforms
  );

  orderedSelfTransforms.forEach(selfTransform => {
    selfTransform?.forEach(_selfTransform => {
      _selfTransform();
    });
  });

  return { ctf, orderedSelfTransforms };
}

export function validateCtf(ctf: CtfMap, interfaceState: InterfaceState): void {
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
  interfaceState: InterfaceState
): Map<string, CtfWithHelpers> {
  const ctfMap: Map<string, CtfWithHelpers> = new Map();

  ctfs
    .map(normalizeCtf)
    .forEach(
      (
        ctfWithHelpers: CtfWithHelpers,
        _,
        ctfsWithHelpers: CtfWithHelpers[]
      ) => {
        if (ctfWithHelpers.interfaces.length) {
          ctfWithHelpers.interfaces.forEach(e => {
            if (
              'resolveSkill' in e.module &&
              typeof e.module.resolveSkill === 'function'
            ) {
              if (
                e.module.resolveSkill(ctfsWithHelpers, interfaceState) !== false
              ) {
                ctfMap.set(ctfWithHelpers.name, ctfWithHelpers);
              }
            } else {
              ctfMap.set(ctfWithHelpers.name, ctfWithHelpers);
            }
          });
        } else {
          ctfMap.set(ctfWithHelpers.name, ctfWithHelpers);
        }
      }
    );

  validateCtf(ctfMap, interfaceState);

  return ctfMap;
}

/**
 * Add skills to a given list of skills to ensure that the list has a complete set
 * of standard ctfs. Also remove skills that do not support the current interfaceState
 * @REFACTOR Share logic between this and CTF(). Much duplication here
 * @TODO @REFACTOR Call this function inside of CTF and make this fuction private
 */
export function addMissingDefaultSkillsToCtf(
  ctfMapWithMissingSkills: CtfMap,
  interfaceState: InterfaceState
): CtfMap {
  // Remove skills that do not support the current interfaceState
  const ctfNodesToBeRemoved: Array<string> = [];

  ctfMapWithMissingSkills.forEach(ctfNode => {
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
    ctfMapWithMissingSkills.delete(ctfNodeName);
  });

  // Create a set of standard skills
  const defaultCtfsMap = new Map([
    ['lint', CORE_CTFS.eslint],
    ['format', CORE_CTFS.prettier],
    [
      'build',
      require('@alfred/interface-build').resolveSkill(
        Object.values(CORE_CTFS),
        interfaceState
      )
    ],
    [
      'start',
      require('@alfred/interface-start').resolveSkill(
        Object.values(CORE_CTFS),
        interfaceState
      )
    ],
    ['test', CORE_CTFS.jest]
  ]);

  const defaultSubCommands: Set<string> = new Set(defaultCtfsMap.keys());
  // Create a set of subcommands that the given CTF has
  const ctfSubcommands: Set<string> = Array.from(
    ctfMapWithMissingSkills.values()
  ).reduce((prev: Set<string>, ctfNode: CtfNode) => {
    if (ctfNode.interfaces && ctfNode.interfaces.length) {
      ctfNode.interfaces.forEach(_interface => {
        const { subcommand } = _interface.module;
        prev.add(subcommand);
      });
    }
    return prev;
  }, new Set());

  defaultSubCommands.forEach(defaultSubCommand => {
    if (!ctfSubcommands.has(defaultSubCommand)) {
      const defaultCtfToAdd = defaultCtfsMap.get(defaultSubCommand);
      ctfMapWithMissingSkills.set(defaultCtfToAdd.name, defaultCtfToAdd);
    }
  });

  // Add all the CORE_CTF's without subcommands
  // @HACK
  if (!ctfMapWithMissingSkills.has('babel')) {
    ctfMapWithMissingSkills.set('babel', CORE_CTFS.babel);
  }

  validateCtf(ctfMapWithMissingSkills, interfaceState);

  return ctfMapWithMissingSkills;
}

/**
 * @DEPRECATE
 * @REFACTOR Move to Config and renaem to generateCtfFromInterface
 */
export async function generateCtfFromProject(
  config: ConfigInterface,
  interfaceState: InterfaceState
): Promise<CtfMap> {
  // Generate the CTF
  const tmpCtf: CtfMap = new Map();
  const { skills } = config;

  skills.forEach(([skillPkgName, skillConfig]) => {
    // Add the skill config to the ctfNode
    const ctfNode: CtfNode = require(skillPkgName);
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

  return addMissingDefaultSkillsToCtf(
    CTF(Array.from(tmpCtf.values()), interfaceState),
    interfaceState
  );
}

/**
 * Intended to be used for testing purposes
 */
export function getDependencies(ctf: CtfMap): Dependencies {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.dependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
}

export function getDevDependencies(ctf: CtfMap): Dependencies {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.devDependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
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
  prevConfig:
    | ConfigWithResolvedSkills
    | ConfigInterface
    | ConfigWithUnresolvedInterfaces,
  currConfig:
    | ConfigWithResolvedSkills
    | ConfigInterface
    | ConfigWithUnresolvedInterfaces
): Promise<Array<string>> {
  const stateWithDuplicateDeps = await Promise.all(
    INTERFACE_STATES.map(interfaceState =>
      Promise.all([
        generateCtfFromProject(new Config(prevConfig), interfaceState),
        generateCtfFromProject(new Config(currConfig), interfaceState)
      ])
    )
  );

  return Array.from(
    new Set(stateWithDuplicateDeps.map(([a, b]) => diffCtfDeps(a, b)).flat())
  );
}
