import path from 'path';
import fs from 'fs';
import npm from 'npm';
import yarn from 'yarn-api';
import CTF, {
  getDevDependencies,
  CORE_CTFS,
  INTERFACE_STATES,
  normalizeInterfacesOfSkill,
  AddCtfHelpers
} from '@alfredpkg/core';
import type { CtfMap, InterfaceState } from '@alfredpkg/core';
import ValidateConfig from './Validation';
import { getProjectRoot } from './CLI';

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

const projectRoot = getProjectRoot();

export function generateInterfaceStatesFromProject(): Array<InterfaceState> {
  const envs = ['production', 'development', 'test'];
  // Default to development env if no config given
  const env = envs.includes(process.env.NODE_ENV)
    ? process.env.NODE_ENV
    : 'development';

  return ENTRYPOINTS.filter(e =>
    fs.existsSync(path.join(projectRoot, 'src', e))
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

export type AlfredConfig = {
  npmClient: 'npm' | 'yarn',
  skills: Array<string>,
  root: string,
  showConfigs: boolean
};

/**
 * Add skills to a given list of skills to ensure that the list has a complete set
 * of standard ctfs
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
  ctf.set('babel', { ...CORE_CTFS.babel, ...AddCtfHelpers });
  // @TODO
  // ctf.set('lodash', { ...CORE_CTFS.lodash, ...AddCtfHelpers });

  ctf.forEach(ctfNode => {
    const ctfWithHelpers = {
      ...ctfNode,
      ...AddCtfHelpers
    };
    Object.entries(ctfWithHelpers.ctfs || {}).forEach(([ctfName, ctfFn]) => {
      const correspondingCtfNode = ctf.get(ctfName);
      if (correspondingCtfNode) {
        ctf.set(
          ctfName,
          ctfFn(correspondingCtfNode, ctf, { alfredConfig, ...interfaceState })
        );
      }
    });
  });

  return ctf;
}

export async function loadConfigs(
  pkgPath: string = path.join(projectRoot, 'package.json')
): Promise<{ pkg: Object, pkgPath: string, alfredConfig: AlfredConfig }> {
  if (!fs.existsSync(pkgPath)) {
    throw new Error('Current working directory does not have "package.json"');
  }

  // Read the package.json and validate the Alfred config
  const pkg = JSON.parse((await fs.promises.readFile(pkgPath)).toString());
  const tmpAlfredConfig = pkg.alfred || {};
  ValidateConfig(tmpAlfredConfig || {});

  const defaultOpts = {
    npmClient: 'npm',
    skills: [],
    root: projectRoot
  };
  const alfredConfig = Object.assign({}, defaultOpts, tmpAlfredConfig);

  return { pkg, pkgPath, alfredConfig };
}

export default async function generateCtfFromConfig(
  alfredConfig: AlfredConfig,
  interfaceState: InterfaceState
): Promise<CtfMap> {
  // Check if any valid entrypoints exist
  const states = generateInterfaceStatesFromProject();
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
  skills.forEach(skill => {
    /* eslint-disable */
    const c = require(skill);
    /* eslint-enable */
    tmpCtf.set(c.name, c);
  });

  const ctf = CTF(Array.from(tmpCtf.values()), alfredConfig, interfaceState);
  addMissingStdSkillsToCtf(ctf, alfredConfig, interfaceState);

  return ctf;
}

export async function diffCtfDepsOfAllInterfaceStates(
  prevAlfredConfig: AlfredConfig,
  currAlfredConfig: AlfredConfig
): Set<string> {
  const stateWithDuplicateDeps = await Promise.all(
    INTERFACE_STATES.map(state =>
      Promise.all([
        generateCtfFromConfig(prevAlfredConfig, state),
        generateCtfFromConfig(currAlfredConfig, state)
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
