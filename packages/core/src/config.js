/* eslint import/no-dynamic-require: off, no-param-reassign: off */
import path from 'path';
import fs from 'fs';
import formatPkg from 'format-package';
import mergeConfigs from '@alfred/merge-configs';
import { requireConfig } from '@alfred/helpers';
import ValidateAlfredConfig from './validation';
import type { AlfredConfig, Pkg } from './types';

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

export type ConfigSkillType = [string, any] | string;

type ConfigMap = Map<string, any>;

export function formatPkgJson(pkg: Pkg): Promise<string> {
  return formatPkg(pkg, { order: PKG_SORT_ORDER });
}

export default class Config {
  alfredConfig: AlfredConfig;

  pkg: ?Pkg;

  pkgPath: ?string;

  root: ?string;

  constructor(
    config: AlfredConfig = {},
    projectRoot: ?string,
    pkg: ?Pkg,
    pkgPath: ?string
  ) {
    ValidateAlfredConfig(config);
    this.alfredConfig = config;
    this.root = projectRoot;
    this.pkg = pkg;
    this.pkgPath = pkgPath;
  }

  static validatePkgPath(pkgPath) {
    if (!fs.existsSync(pkgPath)) {
      throw new Error('Current working directory does not have "package.json"');
    }
  }

  /**
   * Write the config to a package.json file
   * @param {string} pkgPath - The path to the package.json file
   * @private
   */
  async write(pkgPath: string): AlfredConfig {
    this.validatePkgPath(pkgPath);
    const formattedPkg = await formatPkgJson(this.alfredConfig);
    await fs.promises.writeFile(pkgPath, formattedPkg);
    return formattedPkg;
  }

  /**
   * @private
   */
  normalizeWithResolvedSkills(): AlfredConfig {
    const { alfredConfig: config } = this;
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
    this.alfredConfig = normalizedConfig;

    return normalizedConfig;
  }

  /**
   * Initialize a config from the root directory of an alfred project
   */
  static async initFromProjectRoot(projectRoot: string): Config {
    const pkgPath: string = path.join(projectRoot, 'package.json');
    this.validatePkgPath(pkgPath);

    // Read the package.json and validate the Alfred config
    const pkg = JSON.parse((await fs.promises.readFile(pkgPath)).toString());

    return new Config(pkg.alfred, projectRoot, pkg, pkgPath);
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

    this.alfredConfig = mergedConfig;

    return mergedConfig;
  }
}
