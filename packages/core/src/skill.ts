/* eslint import/no-dynamic-require: off, @typescript-eslint/ban-ts-ignore: off */
import path from 'path';
import lodash from 'lodash';
import mergeConfigs from '@alfred/merge-configs';
import {
  ConfigInterface,
  SkillMap,
  ProjectInterface,
  SkillConfig,
  ProjectEnum,
  Platform,
  Dependencies,
  DependencyType,
  PkgJson,
  FileType,
  Skill,
  RawSkill,
  Env,
  Target,
  Helpers,
  ConfigValue,
  SkillWithoutHelpers,
  Supports,
  SkillInterfaceModule
} from '@alfred/types';
import {
  getDepsFromPkg,
  fromPkgTypeToFull,
  EnhancedMap
} from '@alfred/helpers';
import { CORE_INTERFACES, CORE_SKILLS } from './constants';
import VirtualFileSystem from './virtual-file';
import { normalizeInterfacesOfSkill } from './interface';

export function addSkillHelpers(skill: SkillWithoutHelpers): Skill {
  const helpers: Helpers<Skill> = {
    findConfig(configName: string): SkillConfig {
      // @HACK This should eventually be removed
      // @ts-ignore
      const config = this.configs.get(configName);
      if (!config) {
        throw new Error(`Cannot find config with name "${configName}"`);
      }
      return config;
    },
    extendConfig(configName: string, configExtension: ConfigValue): Skill {
      // @HACK This should eventually be removed
      // @ts-ignore
      const foundConfig = this.configs?.get(configName);
      if (!foundConfig) {
        throw new Error(`Cannot find config with name "${configName}"`);
      }
      const mergedConfig = mergeConfigs({}, foundConfig, {
        config: configExtension
      }) as SkillConfig;
      // @HACK This should eventually be removed
      // @ts-ignore
      const configs = this.configs.map(config =>
        config.alias === configName ? mergedConfig : config
      );
      return lodash.merge({}, skill, this, {
        configs
      });
    },
    replaceConfig(configName: string, configReplacement: ConfigValue): Skill {
      // @HACK This should eventually be removed
      // @ts-ignore
      const configs = this.configs.map(config =>
        config.alias === configName
          ? { ...config, config: configReplacement }
          : config
      );
      return lodash.merge({}, skill, this, {
        configs
      });
    },
    setWrite(configName: string, shouldWrite: boolean): Skill {
      const newConfig = {
        ...this.findConfig(configName),
        write: shouldWrite
      };
      return this.replaceConfig(configName, newConfig);
    },
    addDeps(dependencies: Dependencies): Skill {
      return lodash.merge({}, skill, this, {
        dependencies
      });
    },
    addDevDeps(devDependencies: Dependencies): Skill {
      return lodash.merge({}, skill, this, {
        devDependencies
      });
    },
    addDepsFromPkg(
      pkgs: string | string[],
      // @HACK This should eventually be removed
      // @ts-ignore
      pkg: PkgJson | undefined = this.pkg,
      fromPkgType: DependencyType = 'dev',
      toPkgType: DependencyType = 'dev'
    ): Skill {
      const mergedPkg = lodash.merge(
        {
          dependencies: {},
          devDependencies: {},
          peerDependencies: {}
        },
        pkg || {}
      );
      const depsToAdd = getDepsFromPkg(pkgs, mergedPkg, fromPkgType);
      const toPkgTypeFullName = fromPkgTypeToFull(toPkgType);

      return lodash.merge({}, skill, this, {
        [toPkgTypeFullName]: depsToAdd
      });
    }
  };

  return {
    ...skill,
    ...helpers
  };
}

/**
 * This function is kept async in order to allow transforms to be async in the future. Keeping
 * it async now will allow for easier migration to async skill transforms in the future without
 * the need for breaking changes.
 */
export async function runTransforms(
  project: ProjectInterface,
  skillMap: SkillMap
): Promise<SkillMap> {
  project.emit('beforeTransforms');

  skillMap.forEach(skill => {
    Object.entries(skill.transforms || {}).forEach(
      ([toSkillName, transform]) => {
        if (skillMap.has(toSkillName)) {
          const transformResult = transform(skillMap.get(skill.name) as Skill, {
            toSkill: skillMap.get(toSkillName) as Skill,
            skillMap: skillMap,
            config: project.config,
            project
          });
          if (!transformResult) {
            throw new Error(
              `Transform from ${skill.name} to ${toSkillName} must return a new skill`
            );
          }
          skillMap.set(skill.name, transformResult);
        }
      }
    );
  });

  project.emit('afterTransforms');

  return skillMap;
}

function getFileTypeFromFile(file: string): FileType {
  const { ext } = path.parse(file);
  switch (ext) {
    case '.json':
      return 'json';
    case '.js':
      return 'commonjs';
    default:
      console.warn(`fileType could not be inferred for config path "${file}"`);
      return 'json';
  }
}

function normalizeSkill(skill: RawSkill | Skill): Skill {
  const configs = new EnhancedMap<string, SkillConfig>();

  skill.configs?.forEach((config: SkillConfig) => {
    configs.set(config.alias || config.filename, {
      ...config,
      fileType: config.fileType || getFileTypeFromFile(config.filename)
    });
  });

  const skillDefaults = {
    transforms: {},
    hooks: {},
    devDependencies: {},
    dependencies: {},
    pkg: {},
    description: '',
    default: false,
    dirs: [],
    userConfig: {}
  };

  const supports: Supports = Object.assign(
    {
      envs: ['production', 'development', 'test'] as Env[],
      projects: ['app', 'lib'] as ProjectEnum[],
      platforms: ['browser', 'node'] as Platform[]
    },
    skill.supports
  );

  const skillWithoutHelpers: SkillWithoutHelpers = lodash.merge(
    {},
    skillDefaults,
    skill,
    {
      interfaces: normalizeInterfacesOfSkill(skill.interfaces || []),
      files: Array.isArray(skill.files)
        ? new VirtualFileSystem(skill.files || [], skill.dirs)
        : skill.files || new VirtualFileSystem([]),
      configs,
      supports
    }
  );

  return {
    ...skillWithoutHelpers,
    ...addSkillHelpers(skillWithoutHelpers)
  };
}

export function requireSkill(skillPkgName: string): Skill {
  try {
    const requiredModule = require(skillPkgName);
    try {
      const requiredSkill = {
        ...(requiredModule.default || requiredModule),
        pkg: require(`${skillPkgName}/package.json`),
        devDependencies: require(`${skillPkgName}/package.json`)
          .peerDependencies
      };
      return {
        ...requiredSkill,
        ...normalizeSkill(requiredSkill)
      };
    } catch (err) {
      console.log(err);
      throw new Error(`Cannot load skill module '${skillPkgName}'`);
    }
  } catch (err) {
    console.log(err);
    throw new Error(`Cannot find skill module '${skillPkgName}'`);
  }
}

/**
 * Convert entrypoints to targets
 */
export function entrypointsToTargets(
  entrypoints: Array<string>
): Array<Target> {
  return entrypoints.map(entrypoint => {
    const [project, platform] = entrypoint.split('.') as [
      ProjectEnum,
      Platform
    ];
    return { project, platform, env: 'production' };
  });
}

function validateSkillMap(skillMap: SkillMap, target: Target): SkillMap {
  skillMap.forEach(skill => {
    // Validate the files of a skill
    if (skill.files) {
      skill.files.forEach(file => {
        if (file.content && file.src) {
          throw new Error(
            'File cannot have both "content" and "src" properties'
          );
        }
      });
    }
    // Validate if a skill is supported for a certain target
    if (skill.supports) {
      const supports = {
        env: skill.supports.envs.includes(target.env),
        platform: skill.supports.platforms.includes(target.platform),
        project: skill.supports.projects.includes(target.project)
      };
      const { env, platform, project } = supports;
      const isSupported = env && platform && project;
      if (!isSupported) {
        throw new Error(
          `The "${skill.name}" skill, which supports ${JSON.stringify(
            skill.supports
          )}}, does not support the current environment, project type, or target, which are ${JSON.stringify(
            target
          )}`
        );
      }
    }
  });

  return skillMap;
}

export function skillSupportsTarget(skill: Skill, target: Target): boolean {
  if (!skill.supports) return true;
  return (
    skill.supports.envs.includes(target.env) &&
    skill.supports.platforms.includes(target.platform) &&
    skill.supports.projects.includes(target.project)
  );
}

/**
 * Add skills to a given list of skills to ensure that the list has a complete set
 * of standard skills. Also remove skills that do not support the current target
 */
export async function Skills(
  project: ProjectInterface,
  skills: Array<Skill | RawSkill> = [],
  target?: Target
): Promise<Map<string, Skill>> {
  const skillMap: Map<string, Skill> = new Map();
  const normalizedSkills = skills.map(normalizeSkill);
  const skillsToResolveFrom = [
    ...normalizedSkills,
    ...Object.values(CORE_SKILLS)
  ];

  const subcommandMap = new Map<string, SkillInterfaceModule>(CORE_INTERFACES);

  normalizedSkills.forEach((skill: Skill) => {
    if (skill.interfaces.length) {
      skill.interfaces.forEach(skillInterface => {
        subcommandMap.set(
          skillInterface.module.subcommand,
          skillInterface.module
        );
      });
    } else {
      if (target) {
        if (skillSupportsTarget(skill, target)) {
          skillMap.set(skill.name, skill);
        }
      } else if (
        project.targets.some(target => skillSupportsTarget(skill, target))
      ) {
        skillMap.set(skill.name, skill);
      }
    }
  });

  subcommandMap.forEach(skillInterface => {
    if (target) {
      const resolvedSkill = skillInterface.resolveSkill(
        skillsToResolveFrom,
        target
      );
      skillMap.set(resolvedSkill.name, resolvedSkill);
    } else {
      project.targets.forEach(target => {
        const resolvedSkill = skillInterface.resolveSkill(
          skillsToResolveFrom,
          target
        );
        skillMap.set(resolvedSkill.name, resolvedSkill);
      });
    }
  });

  if (target) {
    validateSkillMap(skillMap, target);
  }

  // Add all the CORE_SKILL's without subcommands
  // @HACK
  if (!skillMap.has('babel')) {
    skillMap.set('babel', CORE_SKILLS.babel);
  }

  await runTransforms(project, skillMap);

  return skillMap;
}

/**
 * 1. Add default skills to skill
 * 2. Validate skill
 * 3. Run skill transformations
 */
export default async function skillMapFromConfig(
  project: ProjectInterface,
  config: ConfigInterface = project.config
): Promise<SkillMap> {
  // Generate the skill map
  const skillMapFromConfigSkills: SkillMap = new Map();

  config.skills.forEach(([skillPkgName, skillUserConfig = {}]) => {
    // Add the skill config to the skill
    let skill: Skill = requireSkill(skillPkgName);
    skill.userConfig = skillUserConfig;
    if (skill.configs.size === 1) {
      const [name] = Array.from(skill.configs.keys());
      skill = skill.extendConfig(name, skillUserConfig);
    }
    skillMapFromConfigSkills.set(skill.name, skill);
  });

  return Skills(project, Array.from(skillMapFromConfigSkills.values()));
}
