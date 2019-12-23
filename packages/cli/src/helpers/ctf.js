/* eslint import/no-dynamic-require: off */
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import npm from 'npm';
import CTF, {
  getDevDependencies,
  CORE_CTFS,
  INTERFACE_STATES,
  normalizeInterfacesOfSkill,
  AddCtfHelpers,
  validateCtf,
  callCtfFnsInOrder,
  getConfigsBasePath,
  writeConfig
} from '@alfred/core';
import mergeConfigs from '@alfred/merge-configs';
import formatJson from 'format-package';
import type { CtfMap, InterfaceState, AlfredConfig } from '@alfred/core';

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

export function generateInterfaceStatesFromProject(
  config: AlfredConfig
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

  newCtf.forEach(([dependency, semver]) => {
    if (oldCtfMap.has(dependency)) {
      if (oldCtfMap.get(dependency) !== semver) {
        throw new Error('Cannot resolve diff deps');
      }
    } else {
      diffDeps.set(dependency, semver);
    }
  });

  return Array.from(newCtf.entries()).map(([key, val]) => `${key}@${val}`);
}

/**
 * Write configs to a './.configs' directory
 * @TODO @REFACTOR Move to CLI
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
      return writeConfig(path.join(root, 'package.json'), {
        ...pkg,
        dependencies: newDependencies
      });
    }
    default: {
      throw new Error('Unsupported npm client. Can only be "npm" or "yarn"');
    }
  }
}

/**
 * Add skills to a given list of skills to ensure that the list has a complete set
 * of standard ctfs. Also remove skills that do not support the current interfaceState
 * @TODO @REFACTOR Share logic between this and CTF(). Much duplication here
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

/**
 * @TODO @REFACTOR Move to core
 */
export default async function generateCtfFromConfig(
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
