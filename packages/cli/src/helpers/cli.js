// @flow
import path from 'path';
import fs from 'fs';
import pkgUp from 'pkg-up';
import rimraf from 'rimraf';
import { getConfigsBasePath, loadConfig } from '@alfredpkg/core';
import type { AlfredConfig, InterfaceState } from '@alfredpkg/core';
import { ENTRYPOINTS, generateInterfaceStatesFromProject } from './ctf';

/**
 * Check if a directory contains an Alfred project
 */
export function checkIsAlfredProject(
  config: AlfredConfig,
  interfaceStates: Array<InterfaceState>
) {
  const srcPath = path.join(config.root, 'src');

  if (!fs.existsSync(srcPath)) {
    throw new Error(
      '"./src" directory does not exist. This does not seem to be an Alfred project'
    );
  }

  const hasEntrypoint = ENTRYPOINTS.some(e =>
    fs.existsSync(path.join(srcPath, e))
  );

  if (!hasEntrypoint) {
    throw new Error(
      'An entrypoint could not be found in the "./src" directory'
    );
  }

  // Run validation that is specific to each interface state
  interfaceStates
    .map(interfaceState =>
      [
        interfaceState.projectType,
        interfaceState.target,
        interfaceState.env
      ].join('.')
    )
    .forEach(interfaceStateString => {
      switch (interfaceStateString) {
        case 'app.browser.production':
        case 'app.browser.development': {
          const indexHtmlPath = path.join(srcPath, 'index.html');
          if (!fs.existsSync(indexHtmlPath)) {
            throw new Error(
              'An "./src/index.html" file must exist when targeting a browser environment'
            );
          }
          break;
        }
        default:
          break;
      }
    });
}

/**
 * Get the root of a project from the current working directory
 */
export function getProjectRoot() {
  const pkgPath = pkgUp.sync();
  if (!pkgPath) {
    throw new Error(`Project root could not be found from "${process.cwd()}"`);
  }
  return path.dirname(pkgPath);
}

export async function init() {
  const projectRoot = getProjectRoot();
  const config = await loadConfig(projectRoot);
  const { alfredConfig } = config;
  const interfaceStates = generateInterfaceStatesFromProject(alfredConfig);
  checkIsAlfredProject(alfredConfig, interfaceStates);
  return { ...config, projectRoot };
}

/**
 * Delete .configs dir
 */
export function deleteConfigs(config: AlfredConfig): Promise<void> {
  const configsBasePath = getConfigsBasePath(config.root);
  if (fs.existsSync(configsBasePath)) {
    return new Promise(resolve => {
      rimraf(configsBasePath, () => {
        resolve();
      });
    });
  }
  return Promise.resolve();
}

export default function getSingleSubcommandFromArgs(
  args: Array<string>
): string {
  switch (args.length) {
    case 0: {
      throw new Error('One subcommand must be passed');
    }
    case 1: {
      break;
    }
    default: {
      throw new Error('Only one subcommand can be passed');
    }
  }

  return args[0];
}
