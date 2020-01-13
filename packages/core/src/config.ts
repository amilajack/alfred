/* eslint import/no-dynamic-require: off, no-param-reassign: off */
import * as path from 'path';
import * as fs from 'fs';
import mergeConfigs from '@alfred/merge-configs';
import { requireConfig } from '@alfred/helpers';
import ValidateConfig from './validation';
import Project, { formatPkgJson } from './project';
import CTF, {addMissingStdSkillsToCtf} from './ctf';
import { ConfigInterface, Skill, NpmClients, UnresolvedConfigInterface, ResolvedConfigInterface, CtfNode, CtfMap, InterfaceState } from './types';

type ConfigSkill = [string, any] | string;

type ConfigMap = Map<string, any>;

export default class Config implements ConfigInterface {
  extends: string | Array<string>;

  npmClient: NpmClients = 'npm';

  showConfigs: boolean;

  skills: Array<Skill>;

  autoInstall: boolean = false;

  static DEFAULT_CONFIG = {
    skills: [],
    showConfigs: false
  };

  constructor(config: UnresolvedConfigInterface | ResolvedConfigInterface | ConfigInterface) {
    ValidateConfig(config);
    this.normalizeWithResolvedSkills();

    this.extends = 'extends' in config ? config.extends : '';
    this.skills = config.skills;
    this.showConfigs = config.showConfigs;
    this.npmClient = config.npmClient;
  }

  getConfigWithDefaults(): UnresolvedConfigInterface {
    return {
      ...Config.DEFAULT_CONFIG,
      ...this.getConfigValues()
    };
  }

  getConfigValues(): UnresolvedConfigInterface {
    return {
      extends: this.extends,
      skills: this.skills,
      showConfigs: this.showConfigs,
      npmClient: this.npmClient,
      autoInstall: this.autoInstall
    };
  }

  /**
   * Write the config to a package.json file
   * @param pkgPath - The path to the package.json file
   */
  async write(pkgPath: string): Promise<string> {
    Project.validatePkgPath(pkgPath);
    return Config.writeToPkgJson(pkgPath, {
      ...JSON.parse((await fs.promises.readFile(pkgPath)).toString()),
      alfred: this.getConfigValues()
    });
  }

  private normalizeWithResolvedSkills(): ResolvedConfigInterface {
    const normalizedConfig = this.normalizeWithResolvedConfigs(this);
    if (!normalizedConfig.skills || !normalizedConfig.skills.length)
      return normalizedConfig;

    const skillsMap: ConfigMap = new Map();
    const mappedSkills: ConfigMap = normalizedConfig.skills.reduce(
      (map: ConfigMap, skill: ConfigSkill) => {
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

    return normalizedConfig;
  }

  /**
   * Initialize a config from the root directory of an alfred project
   */
  static initFromProjectRoot(projectRoot: string): Config {
    const pkgPath = path.join(projectRoot, 'package.json');
    Project.validatePkgPath(pkgPath);

    // Read the package.json and validate the Alfred config
    const { alfred } = JSON.parse(fs.readFileSync(pkgPath).toString());

    return new Config(alfred);
  }

  private normalizeWithResolvedConfigs(config: UnresolvedConfigInterface): ResolvedConfigInterface {
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

  /**
   * Merge an object to the existing package.json and write it
   */
  static async writeToPkgJson(pkgPath: string, obj: Object): Promise<string> {
    Project.validatePkgPath(pkgPath);
    const pkg = {
      ...JSON.parse((await fs.promises.readFile(pkgPath)).toString()),
      ...obj
    };
    const formattedPkg = await formatPkgJson(pkg);
    await fs.promises.writeFile(pkgPath, formattedPkg);
    return formattedPkg;
  }

  /**
   * @TODO Migrate to this API
   */
  generateCtf(interfaceState: InterfaceState) {
    // Generate the CTF
    const tmpCtf: CtfMap = new Map();
    const { skills = [] } = this;
    skills.forEach(([skillPkgName, skillConfig]) => {
      // Add the skill config to the ctfNode
      const ctfNode: CtfNode = require(skillPkgName);
      ctfNode.config = skillConfig;
      if (ctfNode.configFiles) {
        ctfNode.configFiles = ctfNode.configFiles.map(configFile => ({
          ...configFile,
          config: mergeConfigs(
            {},
            configFile.config,
            // Only apply config if skill has only one config file
            ctfNode.configFiles.length === 1 ? skillConfig : {}
          )
        }));
      }
      tmpCtf.set(ctfNode.name, ctfNode);
    });

    const ctf = CTF(Array.from(tmpCtf.values()), interfaceState);
    addMissingStdSkillsToCtf(this, ctf, interfaceState);

    return ctf;
  }
}
