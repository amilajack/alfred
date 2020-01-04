/* eslint import/no-dynamic-require: off, no-param-reassign: off */
import path from 'path';
import fs from 'fs';
import formatPkg from 'format-package';
import mergeConfigs from '@alfred/merge-configs';
import ValidateAlfredConfig, { requireConfig } from './validation';
import type { AlfredConfig } from './types';

const PKG_SORT_ORDER = [
  'name',
  'version',
  'private',
  'description',
  'keywords',
  'homepage',
  'bugs',
  'repository',
  'license',
  'author',
  'contributors',
  'files',
  'sideEffects',
  'main',
  'module',
  'jsnext:main',
  'browser',
  'types',
  'typings',
  'style',
  'example',
  'examplestyle',
  'assets',
  'bin',
  'man',
  'directories',
  'workspaces',
  'scripts',
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'bundledDependencies',
  'bundleDependencies',
  'optionalDependencies',
  'resolutions',
  'engines',
  'engineStrict',
  'os',
  'cpu',
  'preferGlobal',
  'publishConfig',
  'betterScripts',
  'husky',
  'pre-commit',
  'commitlint',
  'lint-staged',
  'config',
  'nodemonConfig',
  'browserify',
  'babel',
  'browserslist',
  'xo',
  'prettier',
  'eslintConfig',
  'eslintIgnore',
  'stylelint',
  'jest',
  '...rest'
];

export type Pkg = { [x: string]: string };

export type ConfigSkillType = [string, any] | string;

type ConfigMap = Map<string, any>;

export function formatPkgJson(pkg: Pkg): Promise<string> {
  return formatPkg(pkg, { order: PKG_SORT_ORDER });
}

export default class Config {
  config: AlfredConfig;

  constructor(config) {
    this.config = config;
  }

  /**
   * Write the config to a package.json file
   * @param {string} pkgPath - The path to the package.json file
   * @private
   */
  async write(pkgPath: string): AlfredConfig {
    const formattedPkg = await formatPkgJson(this.config);
    await fs.promises.writeFile(pkgPath, formattedPkg);
    return formattedPkg;
  }

  /**
   * @private
   */
  normalizeWithResolvedSkills(): AlfredConfig {
    const { config } = this;
    const normalizedConfig = this.normalizeWithResolvedConfigs(config);
    if (!normalizedConfig.skills || !normalizedConfig.skills.length)
      return normalizedConfig;

    const skillsMap: ConfigMap = new Map();
    const mappedSkills: ConfigMap = normalizedConfig.skills.reduce(
      (map: ConfigMap, skill: ConfigSkillType) => {
        if (typeof skill === 'string') {
          map.set(skill, {});
          return map;
        }
        if (Array.isArray(skill)) {
          const [skillName, skillConfig] = skill;
          if (map.has(skillName)) {
            map.set(
              skillName,
              mergeConfigs({}, map.get(skillName), skillConfig)
            );
          } else {
            map.set(skillName, skillConfig);
          }
          return map;
        }
        throw new Error(`Config type not supported: ${JSON.stringify(skill)}`);
      },
      skillsMap
    );

    normalizedConfig.skills = Array.from(mappedSkills.entries());
    this.config = normalizedConfig;

    return normalizedConfig;
  }

  async init(
    projectRoot: string,
    pkgPath: string = path.join(projectRoot, 'package.json')
  ): Promise<{ pkg: Pkg, pkgPath: string, alfredConfig: AlfredConfig }> {
    if (!fs.existsSync(pkgPath)) {
      throw new Error('Current working directory does not have "package.json"');
    }

    // Read the package.json and validate the Alfred config
    const pkg = JSON.parse((await fs.promises.readFile(pkgPath)).toString());
    const rawAlfredConfig = pkg.alfred;
    ValidateAlfredConfig(rawAlfredConfig);
    // Format the config
    await this.write(pkgPath, pkg);

    const defaultOpts = {
      npmClient: 'npm',
      skills: [],
      root: projectRoot
    };

    this.config = {
      ...defaultOpts,
      ...rawAlfredConfig
    };
    const alfredConfig = this.normalizeWithResolvedSkills();

    return { pkg, pkgPath, alfredConfig };
  }

  /**
   * @private
   */
  normalizeWithResolvedConfigs(config: AlfredConfig = {}): AlfredConfig {
    if (!config.extends) return config;
    // Convert extends: 'my-config' to extends: ['my-config']
    if (typeof config.extends === 'string') {
      config.extends = [config.extends];
    }
    // If a config is a string, require it
    const normalizedConfigs = config.extends.map(_config =>
      // $FlowFixMe
      typeof _config === 'string' ? requireConfig(_config) : _config
    );
    // If nothing to extend then return the config itself without the extends
    // property
    if (config.extends && !config.extends.length) {
      const newConfig = { ...config };
      delete newConfig.extends;
      return newConfig;
    }

    for (let i = 0; i < normalizedConfigs.length; i += 1) {
      // eslint-disable-next-line no-param-reassign
      normalizedConfigs[i] = this.normalizeWithResolvedConfigs(
        normalizedConfigs[i]
      );
    }

    const mergedConfig = mergeConfigs(
      {},
      ...normalizedConfigs.map(e => e),
      config
    );
    delete mergedConfig.extends;
    return mergedConfig;
  }
}
