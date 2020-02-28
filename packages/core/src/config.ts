/* eslint no-param-reassign: off */
import path from 'path';
import fs from 'fs';
import mergeConfigs from '@alfred/merge-configs';
import { requireConfig } from '@alfred/helpers';
import {
  ConfigInterface,
  NpmClients,
  AlfredConfigWithResolvedSkills,
  AlfredConfigWithUnresolvedTasks,
  AlfredConfigSkill,
  AlfredConfigWithUnresolvedSkills,
  AlfredConfigRawSkill,
  AlfredConfigWithDefaults,
  PkgJson
} from '@alfred/types';
import loadJsonFile from 'load-json-file';
import { validateAlfredConfig } from './validation';
import Project, { formatPkgJson } from './project';

type ConfigMap = Map<string, any>;

export default class Config implements ConfigInterface {
  extends?: string | Array<string>;

  npmClient: NpmClients;

  showConfigs: boolean;

  configsDir: string;

  skills: AlfredConfigSkill[];

  autoInstall: boolean;

  private rawConfig: AlfredConfigWithUnresolvedTasks;

  static DEFAULT_CONFIG = {
    skills: [],
    showConfigs: true,
    autoInstall: false,
    configsDir: '.',
    npmClient: 'npm' as NpmClients
  };

  constructor(rawConfig: AlfredConfigWithUnresolvedTasks) {
    validateAlfredConfig(rawConfig);
    const resolvedSkills = {
      ...Config.DEFAULT_CONFIG,
      ...this.normalizeWithResolvedSkills(
        this.normalizeWithResolvedExtendedConfigs(rawConfig)
      )
    };
    // Re-validate because normalized skills may introduce invalid configs
    validateAlfredConfig(resolvedSkills);
    this.rawConfig = rawConfig;
    this.skills = resolvedSkills.skills || [];
    this.showConfigs = resolvedSkills.showConfigs;
    this.configsDir = resolvedSkills.configsDir;
    this.autoInstall = resolvedSkills.autoInstall;
    this.npmClient = resolvedSkills.npmClient;
  }

  getConfigWithDefaults(): AlfredConfigWithDefaults {
    return {
      ...Config.DEFAULT_CONFIG,
      ...this.getConfigValues()
    };
  }

  getConfigValues(): AlfredConfigWithDefaults {
    return {
      skills: this.skills,
      showConfigs: this.showConfigs,
      configsDir: this.configsDir,
      npmClient: this.npmClient,
      autoInstall: this.autoInstall
    };
  }

  getRawConfig(): AlfredConfigWithUnresolvedTasks {
    return this.rawConfig;
  }

  /**
   * Write the config to a package.json file that replaces the existing
   * config
   * @param pkgPath - The path to the package.json file
   */
  async write(
    pkgPath: string,
    pkgAlfredConfig: AlfredConfigWithUnresolvedTasks
  ): Promise<string> {
    Project.validatePkgPath(pkgPath);
    validateAlfredConfig(pkgAlfredConfig);

    const pkg = (await loadJsonFile(pkgPath)) as PkgJson;
    this.rawConfig = pkg.alfred || {};

    return Config.writeObjToPkgJson(pkgPath, {
      alfred: pkgAlfredConfig
    });
  }

  private normalizeWithResolvedSkills(
    config: AlfredConfigWithUnresolvedSkills
  ): AlfredConfigWithResolvedSkills {
    if (!config.skills || !config.skills.length)
      return config as AlfredConfigWithResolvedSkills;

    const skillMap: ConfigMap = new Map();
    const mappedSkills: ConfigMap = config.skills.reduce(
      (map: ConfigMap, skill: AlfredConfigRawSkill) => {
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
      skillMap
    );

    return {
      ...config,
      skills: Array.from(mappedSkills.entries())
    };
  }

  /**
   * Initialize a config from the root directory of an alfred project
   */
  static initFromProjectRoot(projectRoot: string): Config {
    const pkgPath = path.join(projectRoot, 'package.json');
    Project.validatePkgPath(pkgPath);

    // Read the package.json and validate the Alfred config
    const { alfred = {} } = loadJsonFile.sync(pkgPath);

    return new Config(alfred);
  }

  private normalizeWithResolvedExtendedConfigs(
    config: AlfredConfigWithUnresolvedTasks
  ): AlfredConfigWithUnresolvedSkills {
    if (!config.extends) return config;
    // Convert extends: 'my-config' to extends: ['my-config']
    if (typeof config.extends === 'string') {
      config.extends = [config.extends];
    }
    // If a config is a string, require it
    const normalizedConfigs = config.extends.map(_config =>
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
      normalizedConfigs[i] = this.normalizeWithResolvedExtendedConfigs(
        normalizedConfigs[i]
      );
    }

    const mergedConfig = mergeConfigs({}, ...normalizedConfigs, config);
    delete mergedConfig.extends;

    return mergedConfig;
  }

  /**
   * Take a given object and append it to an Alfred project's package.json
   */
  static async writeObjToPkgJson(
    pkgPath: string,
    obj: Record<string, any>,
    pkg?: PkgJson
  ): Promise<string> {
    Project.validatePkgPath(pkgPath);
    const pkgToWrite = {
      ...(pkg || ((await loadJsonFile(pkgPath)) as PkgJson)),
      ...obj
    };
    const formattedPkg = await formatPkgJson(pkgToWrite);
    await fs.promises.writeFile(pkgPath, formattedPkg);
    return formattedPkg;
  }
}
