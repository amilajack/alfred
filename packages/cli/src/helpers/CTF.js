import path from 'path';
import fs from 'fs';
import npm from 'npm';
import yarn from 'yarn-api';
import CTF, {
  writeConfigsFromCtf,
  deleteConfigs,
  getDevDependencies,
  CORE_CTFS
} from '@alfredpkg/core';
import type { CtfMap, InterfaceState } from '@alfredpkg/core';
import ValidateConfig from './Validation';
import { getProjectRoot } from './CLI';

export const ENTRYPOINTS = [
  'lib.node.js',
  'app.node.js',
  'app.browser.js',
  'lib.browser.js',
  'lib.electron.js',
  'app.electron.main.js',
  'app.electron.renderer.js',
  'app.electron.renderer.js'
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
        throw new Error('Cannot resolve diff deps ');
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

/**
 * Add skills to a given list of skills to ensure that the list has a complete set
 * of standard ctfs
 */
export function addMissingStdSkillsToCtf(ctf: CtfMap, state): CtfMap {
  const stdCtf = new Map(
    Object.entries({
      lint: CORE_CTFS.eslint,
      format: CORE_CTFS.prettier,
      // eslint-disable-next-line
      build: require('@alfredpkg/interface-build').resolveSkill(
        Object.values(CORE_CTFS),
        state
      ),
      test: CORE_CTFS.jest
    })
  );
  const stdSubommands = new Set(stdCtf.keys());
  // Create a set of subcommands that the given CTF has
  const ctfSubcommands = Array.from(ctf.values()).reduce((prev, ctfNode) => {
    if (ctfNode.interface) {
      // eslint-disable-next-line
      const { subcommand } = require(ctfNode.interface);
      prev.add(subcommand);
    }
    return prev;
  }, new Set());

  stdSubommands.forEach(command => {
    if (!ctfSubcommands.has(command)) {
      const ctfSkillToAdd = stdCtf.get(command);
      ctf.set(ctfSkillToAdd.name, ctfSkillToAdd);
    }
  });

  // Add all the CORE_CTF's without subcommands
  ctf.set('babel', CORE_CTFS.babel);
  // @TODO
  // ctf.set('react', CORE_CTFS.react);
  // ctf.set('lodash', CORE_CTFS.lodash);

  return ctf;
}

export async function loadConfigs(
  pkgPath: string = path.join(projectRoot, 'package.json')
) {
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
  alfredConfig,
  interfaceState
) {
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
  module.paths.push(`${projectRoot}/node_modules`);
  skills.forEach(skill => {
    /* eslint-disable */
    const c = require(skill);
    /* eslint-enable */
    tmpCtf.set(c.name, c);
  });
  addMissingStdSkillsToCtf(tmpCtf, interfaceState);
  module.paths.pop();

  const ctf = CTF(Array.from(tmpCtf.values()));

  if (alfredConfig.showConfigs) {
    await writeConfigsFromCtf(ctf);
  } else {
    await deleteConfigs();
  }

  return ctf;
}
