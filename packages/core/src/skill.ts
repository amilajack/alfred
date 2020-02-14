/* eslint import/no-dynamic-require: off */
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
  CORE_SKILL,
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
import buildInterface from '@alfred/interface-build';
import startInterface from '@alfred/interface-start';
import testInterface from '@alfred/interface-test';
import formatInterface from '@alfred/interface-format';
import lintInterface from '@alfred/interface-lint';
import {
  getDepsFromPkg,
  fromPkgTypeToFull,
  EnhancedMap
} from '@alfred/helpers';
import VirtualFileSystem from './virtual-file';
import { normalizeInterfacesOfSkill } from './interface';

export function addSkillHelpers(skill: SkillWithoutHelpers): Skill {
  const helpers: Helpers<Skill> = {
    findConfig(configName: string): SkillConfig {
      const config = skill.configs.get(configName);
      if (!config) {
        throw new Error(`Cannot find config with name "${configName}"`);
      }
      return config;
    },
    extendConfig(configName: string, configExtension: ConfigValue): Skill {
      const foundConfig = skill.configs.get(configName);
      if (!foundConfig) {
        throw new Error(`Cannot find config with name "${configName}"`);
      }
      const mergedConfig = mergeConfigs({}, foundConfig, {
        config: configExtension
      }) as SkillConfig;
      const configs = (skill.configs || []).map(config =>
        config.alias === configName ? mergedConfig : config
      );
      return lodash.merge({}, skill, this, {
        configs
      });
    },
    replaceConfig(configName: string, configReplacement: ConfigValue): Skill {
      const configs = (skill.configs || []).map(config =>
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
      pkg: PkgJson | undefined = skill.pkg,
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

export const CORE_SKILLS: { [skill in CORE_SKILL]: Skill } = {
  webpack: requireSkill('@alfred/skill-webpack'),
  babel: requireSkill('@alfred/skill-babel'),
  parcel: requireSkill('@alfred/skill-parcel'),
  eslint: requireSkill('@alfred/skill-eslint'),
  prettier: requireSkill('@alfred/skill-prettier'),
  jest: requireSkill('@alfred/skill-jest'),
  react: requireSkill('@alfred/skill-react'),
  rollup: requireSkill('@alfred/skill-rollup'),
  lodash: requireSkill('@alfred/skill-lodash')
};

// Examples
// 'lib.node.js',
// 'app.node.js',
// 'lib.browser.js',
// 'app.browser.js'
// etc...
export const ENTRYPOINTS = [
  'lib.node.js',
  'app.node.js',
  'lib.browser.js',
  'app.browser.js'
];

/**
 * Convert entrypoints to interface states
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
    // Validate if a skill is supported for a certain interface state
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

const CORE_INTERFACES: Array<[string, SkillInterfaceModule]> = [
  ['build', buildInterface],
  ['start', startInterface],
  ['test', testInterface],
  ['lint', lintInterface],
  ['format', formatInterface]
];

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
  target: Target,
  skills: Array<Skill | RawSkill> = []
): Promise<Map<string, Skill>> {
  const skillMap: Map<string, Skill> = new Map();
  const normalizedSkills = skills.map(normalizeSkill);
  const skillsToResolveFrom = [
    ...Object.values(CORE_SKILLS),
    ...normalizedSkills
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
      if (skillSupportsTarget(skill, target)) {
        skillMap.set(skill.name, skill);
      }
    }
  });

  subcommandMap.forEach(skillInterface => {
    const resolvedSkill = skillInterface.resolveSkill(
      skillsToResolveFrom,
      target
    );
    skillMap.set(resolvedSkill.name, resolvedSkill);
  });

  // Add all the CORE_SKILL's without subcommands
  // @HACK
  if (!skillMap.has('babel')) {
    skillMap.set('babel', CORE_SKILLS.babel);
  }

  await runTransforms(project, skillMap);

  validateSkillMap(skillMap, target);

  return skillMap;
}

/**
 * 1. Add default skills to skill
 * 2. Validate skill
 * 3. Run skill transformations
 */
export default async function skillMapFromConfig(
  project: ProjectInterface,
  target: Target,
  config: ConfigInterface = project.config
): Promise<SkillMap> {
  // Generate the skill map
  const skillMapFromConfigSkills: SkillMap = new Map();

  config.skills.forEach(([skillPkgName, skillUserConfig = {}]) => {
    // Add the skill config to the skill
    const skill: Skill = requireSkill(skillPkgName);
    skill.userConfig = skillUserConfig;
    if (skill.configs.size === 1) {
      const [key, val] = Array.from(skill.configs.entries())[0];
      skill.configs.set(
        key,
        lodash.merge({}, val, { config: skillUserConfig })
      );
    }
    skillMapFromConfigSkills.set(skill.name, skill);
  });

  return Skills(project, target, Array.from(skillMapFromConfigSkills.values()));
}
