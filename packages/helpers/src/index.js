// @flow
/* eslint import/prefer-default-export: off */
/* eslint import/no-dynamic-require: off */
import path from 'path';
import opn from 'opn';
import pkgUp from 'pkg-up';
import childProcess from 'child_process';
import type {
  configFileType,
  configType,
  CtfMap
} from '@alfred/core/lib/types';

export function getConfigByConfigName(
  configName: string,
  configFiles: Array<configFileType>
) {
  const config = configFiles.find(e => e.name === configName);
  if (!config) throw new Error(`Cannot find config by name "${configName}"`);
  return config;
}

export function getConfigPathByConfigName(
  configName: string,
  configFiles: Array<configFileType>
) {
  const config = configFiles.find(e => e.name === configName);
  if (!config) throw new Error(`Cannot find config by name "${configName}"`);
  return config.path;
}

/*
 * Intended to be used for testing purposes
 */
export function getConfigs(ctf: CtfMap): Array<configType> {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.configFiles || [])
    .reduce((p, c) => [...p, ...c], [])
    .map(e => e.config);
}

export function getConfigsBasePath(projectRoot: string): string {
  return path.join(projectRoot, '.configs');
}

export function requireConfig(configName: string): any {
  try {
    // $FlowFixMe
    return require(`alfred-config-${configName}`);
  } catch (e) {
    try {
      // $FlowFixMe
      return require(configName);
    } catch (_e) {
      throw new Error(
        `Could not resolve "${configName}" module or "eslint-config-${configName}" module`
      );
    }
  }
}

/**
 * Get the name of the package JSON
 * @param {string} pkgName The name of the package
 * @param {string} binName The property of the bin object that we want
 */
export async function getPkgBinPath(pkgName: string, binName: string) {
  const pkgPath = require.resolve(pkgName);
  const pkgJsonPath = await pkgUp({ cwd: pkgPath });

  const { bin } = require(pkgJsonPath);
  if (!bin) {
    throw new Error(
      `Module "${pkgName}" does not have a binary because it does not have a "bin" property in it's package.json`
    );
  }

  return path.join(
    path.dirname(pkgJsonPath),
    typeof bin === 'string' ? bin : bin[binName]
  );
}

export function execCommand(cmd: string) {
  return childProcess.execSync(cmd, { stdio: 'inherit' });
}

export async function openInBrowser(url: string, browser: any) {
  // Don't open new tab when running end to end tests. This prevents hundreds
  // of tabs from being opened.
  if (process.env.E2E_CLI_TEST) return;

  try {
    const options = typeof browser === 'string' ? { app: browser } : undefined;
    await opn(url, options);
  } catch (err) {
    console.error(`Unexpected error while opening in browser: ${browser}`);
    console.error(err);
  }
}
