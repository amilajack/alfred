/* eslint import/no-dynamic-require: off */
import path from 'path';
import fs from 'fs';
import npm from 'npm';
import yarn from 'yarn-api';
import CTF, {
  getDevDependencies,
  CORE_CTFS,
  INTERFACE_STATES,
  normalizeInterfacesOfSkill,
  AddCtfHelpers,
  validateCtf,
  callCtfFnsInOrder,
  getConfigsBasePath
} from '@alfredpkg/core';
import mergeConfigs from '@alfredpkg/merge-configs';
import formatJson from 'format-package';
import type { CtfMap, InterfaceState, AlfredConfig } from '@alfredpkg/core';

export const ENTRYPOINTS = [
  'lib.node.js',
  'app.node.js',
  'lib.browser.js',
  'app.browser.js',
  'lib.electron.main.js',
  'lib.electron.renderer.js',
  'app.electron.main.js',
  'app.electron.renderer.js',
  'lib.react-native.js',
  'app.react-native.js'
];

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
 * This is used to figure out which deps need to be installed
 */
export function diffCtfDeps(oldCtf: CtfMap, newCtf: CtfMap): Array<string> {
  // Find the dependencies that have changed and install them
  const t: Map<string, string> = new Map();
  const s: Map<string, string> = new Map();

  Object.entries(getDevDependencies(oldCtf)).forEach(([key, val]) => {
    t.set(key, val);
  });
  Object.entries(getDevDependencies(newCtf)).forEach(([key, val]) => {
    if (t.has(key)) {
      if (t.get(key) !== val) {
        throw new Error('Cannot resolve diff deps');
      }
    } else {
      s.set(key, val);
    }
  });

  return Array.from(s.entries()).map(([key, val]) => `${key}@${val}`);
}

/**
 * Write configs to a './.configs' directory
 * @TODO @REFACTOR Move to CLI
 */
export async function writeConfigsFromCtf(
  ctf: CtfMap,
  config: AlfredConfig
): Promise<CtfMap> {
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
        const convertedConfig =
          typeof configFile.config === 'string'
            ? configFile.config
            : await formatJson(configFile.config);
        // Write sync to prevent data races when writing configs in parallel
        fs.writeFileSync(filePath, convertedConfig);
      })
  );

  return ctf;
}

/**
 * @TODO Account for `devDependencies` and `dependencies`
 */
export function installDeps(
  dependencies: Array<string> = [],
  npmClient: 'npm' | 'yarn' = 'npm'
): Promise<any> {
  if (!dependencies.length) return Promise.resolve();

  switch (npmClient) {
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
    case 'yarn': {
      return new Promise((resolve, reject) => {
        yarn(['why', 'isobject'], err => {
          if (err) reject(err);
          resolve();
        });
      });
    }
    default: {
      throw new Error('Unsupported npm client. Can only be "npm" or "yarn"');
    }
  }
}

/**
 * Add skills to a given list of skills to ensure that the list has a complete set
 * of standard ctfs
 * @TODO @REFACTOR Share logic between this and CTF(). Much duplication here
 */
export function addMissingStdSkillsToCtf(
  ctf: CtfMap,
  alfredConfig: AlfredConfig,
  interfaceState: InterfaceState
): CtfMap {
  const stdCtf = new Map(
    Object.entries({
      lint: CORE_CTFS.eslint,
      format: CORE_CTFS.prettier,
      build: require('@alfredpkg/interface-build').resolveSkill(
        Object.values(CORE_CTFS),
        interfaceState
      ),
      start: require('@alfredpkg/interface-start').resolveSkill(
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
  // @TODO
  // ctf.set('lodash', { ...CORE_CTFS.lodash, ...AddCtfHelpers });

  callCtfFnsInOrder(ctf, alfredConfig, interfaceState);

  return ctf;
}

/**
 * @TODO @REFACTOR Move to core
 */
export default async function generateCtfFromConfig(
  alfredConfig: AlfredConfig,
  interfaceState: InterfaceState
): Promise<CtfMap> {
  // Check if any valid entrypoints exist
  const states = generateInterfaceStatesFromProject(alfredConfig);
  if (!states.length) {
    throw new Error(
      `The project must have at least one entrypoint. Here are some examples of entrypoints:\n\n${ENTRYPOINTS.map(
        e => `"./src/${e}"`
      ).join('\n')}`
    );
  }

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

  validateCtf(ctf, interfaceState);

  return ctf;
}

export async function diffCtfDepsOfAllInterfaceStates(
  prevAlfredConfig: AlfredConfig,
  currAlfredConfig: AlfredConfig
): Set<string> {
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