/* eslint import/no-dynamic-require: off */
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import npm from 'npm';
import { getConfigsBasePath, writeConfig } from '@alfred/core';
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
