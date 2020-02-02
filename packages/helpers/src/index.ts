/* eslint import/prefer-default-export: off, import/no-dynamic-require: off */
import path from 'path';
import open from 'open';
import pkgUp from 'pkg-up';
import childProcess from 'child_process';
import {
  SkillConfigFile,
  ConfigValue,
  AlfredConfigWithUnresolvedInterfaces,
  ProjectInterface,
  ConfigInterface,
  PkgWithAllDeps,
  DependencyType,
  DependencyTypeFull,
  Dependencies,
  SkillNode
} from '@alfred/types';

export function requireSkill(skillName: string): SkillNode {
  return {
    ...require(skillName),
    pkg: require(`${skillName}/package.json`),
    devDependencies: require(`${skillName}/package.json`).peerDependencies
  };
}

export function getConfigByName(
  configName: string,
  configFiles: Array<SkillConfigFile>
): ConfigValue {
  const config = configFiles.find(configFile => configFile.name === configName);
  if (!config) throw new Error(`Cannot find config by name "${configName}"`);
  return config;
}

export function getConfigPathByConfigName(
  configName: string,
  configFiles: Array<SkillConfigFile>
): string {
  const config = configFiles.find(configFile => configFile.name === configName);
  if (!config) throw new Error(`Cannot find config by name "${configName}"`);
  return config.path;
}

export function fromPkgTypeToFull(
  fromPkgType: DependencyType
): DependencyTypeFull {
  switch (fromPkgType) {
    case 'peer':
      return 'peerDependencies';
    case 'dev':
      return 'devDependencies';
    case 'dep':
      return 'dependencies';
    default: {
      throw new Error('Pkg type must be one of peer, dev, or dep');
    }
  }
}

/**
 * Map the environment name to a short name, which is one of ['dev', 'prod', 'test']
 */
export function mapEnvToShortName(envName: string): string {
  switch (envName) {
    case 'production': {
      return 'prod';
    }
    case 'development': {
      return 'dev';
    }
    case 'test': {
      return 'test';
    }
    default: {
      throw new Error(`Unsupported environment "${envName}"`);
    }
  }
}

export function mapShortNameEnvToLongName(envName: string): string {
  switch (envName) {
    case 'prod': {
      return 'production';
    }
    case 'dev': {
      return 'development';
    }
    default: {
      throw new Error(`Unsupported short name environment "${envName}"`);
    }
  }
}

export function getConfigsBasePath(
  project: ProjectInterface,
  config: ConfigInterface = project.config
): string {
  return path.join(project.root, config.configsDir);
}

export function requireConfig(
  configName: string
): AlfredConfigWithUnresolvedInterfaces {
  try {
    return require(`alfred-config-${configName}`);
  } catch (e) {
    try {
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
 * @param pkgName - The name of the package
 * @param binName - The property of the bin object that we want
 */
export async function getPkgBinPath(
  pkgName: string,
  binName: string
): Promise<string> {
  const pkgPath = require.resolve(pkgName);
  const pkgJsonPath = await pkgUp({ cwd: pkgPath });

  if (!pkgJsonPath) {
    throw new Error(`Module "${pkgName}" not found`);
  }

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

export function execCmdInProject(
  project: ProjectInterface,
  cmd: string
): Buffer {
  return childProcess.execSync(cmd, { stdio: 'inherit', cwd: project.root });
}

export async function openUrlInBrowser(
  url: string,
  browser: string
): Promise<void> {
  // Don't open new tab when running end to end tests. This prevents hundreds
  // of tabs from being opened.
  if (process.env.ALFRED_E2E_CLI_TEST) return;

  try {
    const options = typeof browser === 'string' ? { app: browser } : undefined;
    await open(url, options);
  } catch (err) {
    console.error(`Unexpected error while opening in browser: ${browser}`);
    console.error(err);
  }
}

export function getDepsFromPkg(
  pkgs: string | string[],
  pkg: PkgWithAllDeps,
  fromPkgType: DependencyType = 'dev'
): Dependencies {
  const normalizedPkgNames = Array.isArray(pkgs) ? pkgs : [pkgs];
  const fromPkgTypeFull = fromPkgTypeToFull(fromPkgType);

  if (!(fromPkgTypeFull in pkg)) {
    throw new Error(`Given package.json does not have ${fromPkgTypeFull}`);
  }

  normalizedPkgNames.forEach(pkgName => {
    if (!(pkgName in pkg[fromPkgTypeFull])) {
      throw new Error(
        `Package "${pkgName}" does not exist in ${fromPkgTypeFull} of skill package.json`
      );
    }
  });

  return Object.fromEntries(
    normalizedPkgNames.map(pkgName => [pkgName, pkg[fromPkgTypeFull][pkgName]])
  );
}
