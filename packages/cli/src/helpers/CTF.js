import path from 'path';
import fs from 'fs';
import npm from 'npm';
import yarn from 'yarn-api';
import {
  writeConfigsFromCtf,
  deleteConfigs,
  getDevDependencies,
  CORE_CTFS
} from '@alfredpkg/core';
import type { CtfMap } from '@alfredpkg/core';
import ValidateConfig from './Validation';

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
) {
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
export function addMissingStdSkillsToCtf(ctf: CtfMap): CtfMap {
  const stdCtf = new Map(
    Object.entries({
      lint: CORE_CTFS.eslint,
      format: CORE_CTFS.prettier,
      build: CORE_CTFS.webpack,
      test: CORE_CTFS.jest
    })
  );
  const stdSubommands = new Set(stdCtf.keys());
  // Create a set of subcommands that the given CTF has
  const ctfSubcommands = Array.from(ctf.values()).reduce((prev, ctfNode) => {
    if (ctfNode.interface) {
      const { subcommand } = require(ctfNode.interface); // eslint-disable-line
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

  return ctf;
}

export default async function generateCtfFromConfig(
  pkgPath = path.join(process.cwd(), 'package.json')
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
    skills: []
  };
  const alfredConfig = Object.assign({}, defaultOpts, tmpAlfredConfig);

  // Check necessary files exist
  const appPath = path.join(process.cwd(), 'src', 'main.js');
  const libPath = path.join(process.cwd(), 'src', 'lib.js');
  // @TODO Factor into account multiple targets
  if (!(fs.existsSync(appPath) || fs.existsSync(libPath))) {
    throw new Error(
      'Alfred config does not have a `./src/main.js` or a `./src/lib.js`'
    );
  }

  // Generate the CTF
  const ctf: CtfMap = new Map();
  const { skills = [] } = alfredConfig;
  module.paths.push(`${process.cwd()}/node_modules`);
  skills.forEach(skill => {
    /* eslint-disable */
    const c = require(skill);
    /* eslint-enable */
    ctf.set(c.name, c);
  });
  addMissingStdSkillsToCtf(ctf);
  module.paths.pop();

  if (alfredConfig.showConfigs) {
    await writeConfigsFromCtf(ctf);
  } else {
    await deleteConfigs();
  }

  return { pkg, ctf, pkgPath, alfredConfig };
}
