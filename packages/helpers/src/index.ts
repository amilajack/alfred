/* eslint import/prefer-default-export: off */
import path from 'path';
import open from 'open';
import childProcess, { ExecSyncOptions } from 'child_process';
import serialize from 'serialize-javascript';
import {
  AlfredConfigWithUnresolvedTasks,
  ProjectInterface,
  ConfigInterface,
  PkgWithAllDeps,
  DependencyType,
  DependencyTypeFull,
  Dependencies,
  Env,
  EnvShortName,
  Skill,
  Target,
  ParsedFlags
} from '@alfred/types';

import _parseFlags from 'yargs-parser';

export const parseFlags = (flags: string | string[]): ParsedFlags =>
  _parseFlags(flags, {
    configuration: {
      'strip-dashed': true
    }
  });

export class EnhancedMap<K, V> extends Map<K, V> {
  map(fn: (item: V, idx: number, items: [K, V][]) => V): EnhancedMap<K, V> {
    const newMap = new EnhancedMap<K, V>();
    Array.from(this.entries()).forEach(([key, val], idx, items) => {
      newMap.set(key, fn(val, idx, items));
    });
    return newMap;
  }
}

export function configSerialize(config: string | Record<string, any>): string {
  return serialize(config, { unsafe: true });
}

export function configStringify(configStr: TemplateStringsArray): string {
  return ['[alfred]', configStr, '[alfred]']
    .join('')
    .trim()
    .replace(/\n/g, ' ');
}

export const CONFIG_DELIMITER = '[alfred]';

export function configToEvalString(serializedConfig: string): string {
  return serializedConfig
    .replace(/"\[alfred\]/g, '')
    .replace(/\[alfred\]"/g, '');
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
export function mapEnvToShortName(envName: string): EnvShortName {
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

export function mapShortNameEnvToLongName(envName: string): Env {
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
): AlfredConfigWithUnresolvedTasks {
  try {
    const requiredConfig = require(`alfred-config-${configName}`);
    return requiredConfig.default || requiredConfig;
  } catch (e) {
    try {
      const requiredConfig = require(configName);
      return requiredConfig.default || requiredConfig;
    } catch (_e) {
      throw new Error(
        `Could not resolve "${configName}" module or "eslint-config-${configName}" module`
      );
    }
  }
}

export function execCmdInProject(
  project: ProjectInterface,
  cmd: string,
  opts: ExecSyncOptions = {}
): Buffer {
  return childProcess.execSync(cmd, {
    stdio: 'inherit',
    cwd: project.root,
    ...opts
  });
}

/**
 * Get the name of the package JSON
 * @param pkgName - The name of the package
 * @param binName - The property of the bin object that we want
 */
export async function getPkgBinPath(
  project: ProjectInterface,
  pkgName: string
): Promise<string> {
  switch (project.config.npmClient) {
    case 'npm': {
      return execCmdInProject(project, `npm bin ${pkgName}`, { stdio: 'pipe' })
        .toString()
        .trim();
    }
    case 'yarn': {
      return execCmdInProject(project, `yarn bin ${pkgName}`, { stdio: 'pipe' })
        .toString()
        .trim();
    }
    default: {
      throw new Error(`Unsupported npmClient "${project.config.npmClient}"`);
    }
  }
}

export async function openUrlInBrowser(
  url: string,
  browser?: string
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

export function serialPromises(fns: Array<() => Promise<any>>): Promise<any> {
  return fns.reduce(
    (promise: Promise<any>, fn) =>
      // eslint-disable-next-line promise/no-nesting
      promise.then(result => fn().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );
}

export function taskResolvesSkillDefault(
  subcommand: string,
  taskPkgName: string
): (skills: Skill[], target?: Target) => Skill {
  return (skills: Skill[], target?: Target): Skill => {
    const resolvedSkills = skills
      .filter(skill =>
        skill.tasks.some(task => task.module.subcommand === subcommand)
      )
      .filter(skill => {
        const task = skill.tasks.find(
          task => task.module.subcommand === subcommand
        );
        if (!task) {
          throw new Error(
            `No task could be found with "${subcommand}" subcommand`
          );
        }
        const { supports } = task.config;
        if (!supports || !target) {
          return true;
        }
        return (
          supports.envs.includes(target.env) &&
          supports.platforms.includes(target.platform) &&
          supports.projects.includes(target.project)
        );
      });

    if (!resolvedSkills.length) {
      throw new Error('No skills could be resolved');
    }

    if (resolvedSkills.length === 1) {
      return resolvedSkills[0];
    }

    const defaultSkill = resolvedSkills.find(skill => skill.default);

    if (!defaultSkill) {
      throw new Error(
        `Cannot find a default skill for interface ${taskPkgName}`
      );
    }

    return defaultSkill;
  };
}
