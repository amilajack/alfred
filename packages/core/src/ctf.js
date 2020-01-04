/* eslint import/no-dynamic-require: off */
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import npm from 'npm';
import formatJson from 'format-package';
import lodash from 'lodash';
import type { InterfaceState, AlfredConfig } from '@alfred/core';
import mergeConfigs from '@alfred/merge-configs';
import jestCtf from '@alfred/skill-jest';
import babel from '@alfred/skill-babel';
import webpack from '@alfred/skill-webpack';
import eslint from '@alfred/skill-eslint';
import react from '@alfred/skill-react';
import prettier from '@alfred/skill-prettier';
import parcel from '@alfred/skill-parcel';
import rollup from '@alfred/skill-rollup';
import lodashCtf from '@alfred/skill-lodash';
import topsort from './topsort';
import Config from './config';
import { getConfigsBasePath } from './validation';
import { normalizeInterfacesOfSkill, INTERFACE_STATES } from './interface';
import type { CtfMap, configType, CtfHelpers, CtfNode } from './types';

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
    const [projectType, target] = entrypoint.split('.');
    return { projectType, target, env: 'production' };
  });
}

/**
 * Write configs to a './.configs' directory
 */
export async function writeConfigsFromCtf(
  ctf: CtfMap,
  config: AlfredConfig
): Promise<CtfMap> {
  if (!config.showConfigs) return ctf;
  // Create a .configs dir if it doesn't exist
  const configsBasePath = getConfigsBasePath(config.root);
  if (!fs.existsSync(configsBasePath)) {
    fs.mkdirSync(configsBasePath);
  }

  const ctfNodes = Array.from(ctf.values());

  await Promise.all(
    ctfNodes
      .filter(ctfNode => ctfNode.configFiles && ctfNode.configFiles.length)
      .reduce((prev, ctfNode) => prev.concat(ctfNode.configFiles), [])
      .map(async configFile => {
        const filePath = path.join(configsBasePath, configFile.path);
        const stringifiedConfig =
          typeof configFile.config === 'string'
            ? configFile.config
            : await formatJson(configFile.config);
        // Write sync to prevent data races when writing configs in parallel
        const normalizedJsonOrModule =
          configFile.configType === 'module'
            ? `module.exports = ${stringifiedConfig};`
            : stringifiedConfig;
        fs.writeFileSync(filePath, normalizedJsonOrModule);
      })
  );

  return ctf;
}

/**
 * @TODO Account for `devDependencies` and `dependencies`
 */
export async function installDeps(
  dependencies: Array<string> = [],
  npmClient: 'npm' | 'yarn' | 'write' = 'npm',
  alfredConfig: AlfredConfig
): Promise<any> {
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
        cwd: alfredConfig.root,
        stdio: 'inherit'
      });
    }
    // Write the package to the package.json but do not install them. This is intended
    // to be used for end to end testing
    case 'writeOnly': {
      const { root } = alfredConfig;
      const rawPkg = await fs.promises.readFile(
        path.join(root, 'package.json')
      );
      const pkg = JSON.parse(rawPkg.toString());
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
        .reduce((p, c) => ({ ...p, ...c }));
      const newDependencies = {
        ...currentDependencies,
        ...dependenciesAsObject
      };
      const config = new Config({
        ...pkg,
        dependencies: newDependencies
      });
      return config.write(path.join(root, 'package.json'));
    }
    default: {
      throw new Error('Unsupported npm client. Can only be "npm" or "yarn"');
    }
  }
}

export const addCtfHelpers: CtfHelpers = {
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
      ...addCtfHelpers
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

export function addSubCommandsToCtfNodes(ctf: CtfMap): CtfMap {
  ctf.forEach(ctfNode => {
    const subcommands = ctfNode.interfaces.map(e => require(e.name).subcommand);
    // eslint-disable-next-line no-param-reassign
    ctfNode.subcommands = subcommands;
  });
  return ctf;
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
        ...addCtfHelpers
      });
    }
  });

  // Add all the CORE_CTF's without subcommands
  // @HACK
  if (!ctf.has('babel')) {
    ctf.set('babel', { ...CORE_CTFS.babel, ...addCtfHelpers });
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
