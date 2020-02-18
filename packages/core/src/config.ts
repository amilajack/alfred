/* eslint no-param-reassign: off */
import path from 'path';
import fs from 'fs';
import mergeConfigs from '@alfred/merge-configs';
import { requireConfig } from '@alfred/helpers';
import {
  ConfigInterface,
  NpmClients,
  AlfredConfigWithResolvedSkills,
  AlfredConfigWithUnresolvedInterfaces,
  ConfigSkills,
  AlfredConfigWithUnresolvedSkills,
  RawSkillConfigValue,
  AlfredConfigWithDefaults
} from '@alfred/types';
import ValidateConfig from './validation';
import Project, { formatPkgJson } from './project';

type ConfigMap = Map<string, any>;

export default class Config implements ConfigInterface {
  extends: string | Array<string> | undefined;

  npmClient: NpmClients;

  showConfigs: boolean;

  configsDir: string;

  skills: ConfigSkills;

  autoInstall: boolean;

  private rawConfig: AlfredConfigWithUnresolvedInterfaces;

  static DEFAULT_CONFIG = {
    skills: [],
    showConfigs: true,
    autoInstall: false,
    configsDir: '.',
    npmClient: 'npm' as NpmClients
  };

  constructor(rawConfig: AlfredConfigWithUnresolvedInterfaces) {
    ValidateConfig(rawConfig);
    const resolvedSkills = {
      ...Config.DEFAULT_CONFIG,
      ...this.normalizeWithResolvedSkills(
        this.normalizeWithResolvedExtendedConfigs(rawConfig)
      )
    };
    // Re-validate because normalized skills may introduce invalid configs
    ValidateConfig(resolvedSkills);
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

  getRawConfig(): AlfredConfigWithUnresolvedInterfaces {
    return this.rawConfig;
  }

  /**
   * Write the config to a package.json file that replaces the existing
   * config
   * @param pkgPath - The path to the package.json file
   */
  async write(
    pkgPath: string,
    pkgAlfredConfig: AlfredConfigWithUnresolvedInterfaces
  ): Promise<string> {
    Project.validatePkgPath(pkgPath);
    ValidateConfig(pkgAlfredConfig);

    const pkg = JSON.parse((await fs.promises.readFile(pkgPath)).toString());
    this.rawConfig = pkg.alfred || {};

    return Config.writeObjToPkgJsonConfig(pkgPath, {
      ...pkg,
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
      (map: ConfigMap, skill: RawSkillConfigValue) => {
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
    const { alfred = {} } = JSON.parse(fs.readFileSync(pkgPath).toString());

    return new Config(alfred);
  }

  private normalizeWithResolvedExtendedConfigs(
    config: AlfredConfigWithUnresolvedInterfaces
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
   * Merge an object to the existing Alfred package.json config and write the merged config
   */
  static async writeObjToPkgJsonConfig(
    pkgPath: string,
    obj: Record<string, any>
  ): Promise<string> {
    Project.validatePkgPath(pkgPath);
    const pkg = {
      ...JSON.parse((await fs.promises.readFile(pkgPath)).toString()),
      ...obj
    };
    const formattedPkg = await formatPkgJson(pkg);
    await fs.promises.writeFile(pkgPath, formattedPkg);
    return formattedPkg;
  }
}
