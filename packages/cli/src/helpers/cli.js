// @flow
import path from 'path';
import fs from 'fs';
import pkgUp from 'pkg-up';
import rimraf from 'rimraf';
import { getConfigsBasePath } from '@alfredpkg/core';
import type { AlfredConfig } from '@alfredpkg/core';

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
