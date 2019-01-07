import path from 'path';
import fs from 'fs';
import npm from 'npm';
import yarn from 'yarn-api';
import { writeConfigsFromCtf } from '@alfredpkg/core';
import type { CtfMap } from '@alfredpkg/core';

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

          npm.on('log', message => {
            console.log(message);
          });
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

export default async function generateCtfFromConfig() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    throw new Error('Current working directory does not have "package.json"');
  }

  // Check config exists
  const pkg = JSON.parse((await fs.promises.readFile(pkgPath)).toString());
  if (!('alfred' in pkg)) {
    throw new Error('No Alfred config in "package.json"');
  }
  // Validate Config
  const { alfred } = pkg;
  if (!alfred.skills) {
    throw new Error('Alfred config does not have `skills` section');
  }
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
  const { skills = [] } = alfred;
  module.paths.push(`${process.cwd()}/node_modules`);
  skills.forEach(skill => {
    /* eslint-disable */
    const c = require(skill);
    /* eslint-enable */
    ctf.set(c.name, c);
  });
  module.paths.pop();

  // Persist the resulting configs of the CTFs to ./node_modules/.configs or ./configs
  await writeConfigsFromCtf(ctf);

  return { pkg, ctf, pkgPath };
}
