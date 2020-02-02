/* eslint import/no-dynamic-require: off */
import lodash from 'lodash';
import mergeConfigs from '@alfred/merge-configs';
import {
  ConfigInterface,
  SkillMap,
  SkillNode,
  ProjectInterface,
  InterfaceState,
  ConfigFile,
  ProjectEnum,
  Target,
  SkillWithHelpers,
  Dependencies,
  DependencyType,
  PkgJson
} from '@alfred/types';
import {
  getDepsFromPkg,
  fromPkgTypeToFull,
  getConfigsBasePath,
  requireSkill
} from '@alfred/helpers';
import { normalizeInterfacesOfSkill } from './interface';

type CORE_SKILL =
  | 'webpack'
  | 'babel'
  | 'parcel'
  | 'eslint'
  | 'prettier'
  | 'jest'
  | 'react'
  | 'rollup'
  | 'lodash';

export function addSkillHelpers(skill: SkillNode): SkillWithHelpers {
  return {
    ...skill,
    findConfig(configName: string): ConfigFile {
      const config = this.configFiles.find(
        configFile => configFile.name === configName
      );
      if (!config) {
        throw new Error(`Cannot find config with name "${configName}"`);
      }
      return config;
    },
    extendConfig(
      configName: string,
      configExtension: { [x: string]: string } = {}
    ): SkillWithHelpers {
      const foundConfig = this.findConfig(configName);
      const mergedConfigFile = mergeConfigs({}, foundConfig, {
        config: configExtension
      });
      const configFiles = this.configFiles.map(configFile =>
        configFile.name === configName ? mergedConfigFile : configFile
      );
      return lodash.merge({}, this, {
        configFiles
      });
    },
    replaceConfig(
      configName: string,
      configReplacement: ConfigFile
    ): SkillWithHelpers {
      const configFiles = this.configFiles.map(configFile =>
        configFile.name === configName ? configReplacement : configFile
      );
      return {
        ...this,
        configFiles
      };
    },
    addDeps(dependencies: Dependencies): SkillWithHelpers {
      return lodash.merge({}, this, {
        dependencies
      });
    },
    addDevDeps(devDependencies: Dependencies): SkillWithHelpers {
      return lodash.merge({}, this, {
        devDependencies
      });
    },
    addDepsFromPkg(
      pkgs: string | string[],
      pkg: PkgJson | undefined = skill.pkg,
      fromPkgType: DependencyType = 'dev',
      toPkgType: DependencyType = 'dev'
    ): SkillWithHelpers {
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

      return lodash.merge({}, this, {
        [toPkgTypeFullName]: depsToAdd
      });
    }
  };
}

export function runTransforms(
  project: ProjectInterface,
  skillMap: SkillMap
): SkillMap {
  skillMap.forEach(skillNode => {
    Object.entries(skillNode.transforms || {}).forEach(
      ([toskillName, transform]) => {
        if (skillMap.has(toskillName)) {
          skillMap.set(
            skillNode.name,
            transform(skillMap.get(skillNode.name) as SkillNode, {
              toSkill: skillMap.get(toskillName) as SkillNode,
              skillMap: skillMap,
              config: project.config,
              project,
              configsPath: getConfigsBasePath(project)
            })
          );
        }
      }
    );
  });

  return skillMap;
}

function normalizeSkill(skill: SkillNode): SkillWithHelpers {
  return {
    ...addSkillHelpers(skill),
    interfaces: normalizeInterfacesOfSkill(skill.interfaces)
  };
}

export const CORE_SKILLS: { [skill in CORE_SKILL]: SkillWithHelpers } = {
  webpack: normalizeSkill(requireSkill('@alfred/skill-webpack')),
  babel: normalizeSkill(requireSkill('@alfred/skill-babel')),
  parcel: normalizeSkill(requireSkill('@alfred/skill-parcel')),
  eslint: normalizeSkill(requireSkill('@alfred/skill-eslint')),
  prettier: normalizeSkill(requireSkill('@alfred/skill-prettier')),
  jest: normalizeSkill(requireSkill('@alfred/skill-jest')),
  react: normalizeSkill(requireSkill('@alfred/skill-react')),
  rollup: normalizeSkill(requireSkill('@alfred/skill-rollup')),
  lodash: normalizeSkill(requireSkill('@alfred/skill-lodash'))
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
export function entrypointsToInterfaceStates(
  entrypoints: Array<string>
): Array<InterfaceState> {
  return entrypoints.map(entrypoint => {
    const [projectType, target] = entrypoint.split('.') as [
      ProjectEnum,
      Target
    ];
    return { projectType, target, env: 'production' };
  });
}

export function validateSkill(
  skillMap: SkillMap,
  interfaceState: InterfaceState
): SkillMap {
  skillMap.forEach(skillNode => {
    if (skillNode && skillNode.supports) {
      const supports = {
        env: skillNode.supports.envs.includes(interfaceState.env),
        target: skillNode.supports.targets.includes(interfaceState.target),
        projectType: skillNode.supports.projectTypes.includes(
          interfaceState.projectType
        )
      };
      const { env, target, projectType } = supports;
      const isSupported = env && target && projectType;

      if (!isSupported) {
        throw new Error(
          `The "${skillNode.name}" skill, which supports ${JSON.stringify(
            skillNode.supports
          )}}, does not support the current environment, project type, or target, which are ${JSON.stringify(
            interfaceState
          )}`
        );
      }
    }
  });

  return skillMap;
}

/**
 * Add skills to a given list of skills to ensure that the list has a complete set
 * of standard skills. Also remove skills that do not support the current interfaceState
 */
export function Skills(
  project: ProjectInterface,
  skills: Array<SkillNode>,
  interfaceState: InterfaceState
): Map<string, SkillWithHelpers> {
  const skillMap: Map<string, SkillWithHelpers> = new Map();

  skills
    .map(normalizeSkill)
    .forEach(
      (
        skillWithHelpers: SkillWithHelpers,
        _,
        skillsWithHelpers: SkillWithHelpers[]
      ) => {
        if (skillWithHelpers.interfaces.length) {
          skillWithHelpers.interfaces.forEach(skillInterface => {
            if (
              'resolveSkill' in skillInterface.module &&
              typeof skillInterface.module.resolveSkill === 'function'
            ) {
              if (
                skillInterface.module.resolveSkill(
                  skillsWithHelpers,
                  interfaceState
                ) !== false
              ) {
                skillMap.set(skillWithHelpers.name, skillWithHelpers);
              }
            } else {
              skillMap.set(skillWithHelpers.name, skillWithHelpers);
            }
          });
        } else {
          skillMap.set(skillWithHelpers.name, skillWithHelpers);
        }
      }
    );

  // Remove skills that do not support the current interfaceState
  const skillNodesToBeRemoved: Array<string> = [];
  skillMap.forEach(skillNode => {
    if (skillNode && skillNode.supports) {
      const supports = {
        env: skillNode.supports.envs.includes(interfaceState.env),
        target: skillNode.supports.targets.includes(interfaceState.target),
        projectType: skillNode.supports.projectTypes.includes(
          interfaceState.projectType
        )
      };
      const { env, target, projectType } = supports;
      const isSupported = env && target && projectType;
      if (!isSupported) {
        skillNodesToBeRemoved.push(skillNode.name);
      }
    }
  });
  skillNodesToBeRemoved.forEach(skillNodeName => {
    skillMap.delete(skillNodeName);
  });

  // Create a set of standard skills
  const defaultSkillsMap = new Map([
    ['lint', CORE_SKILLS.eslint],
    ['format', CORE_SKILLS.prettier],
    [
      'build',
      require('@alfred/interface-build').resolveSkill(
        Object.values(CORE_SKILLS),
        interfaceState
      )
    ],
    [
      'start',
      require('@alfred/interface-start').resolveSkill(
        Object.values(CORE_SKILLS),
        interfaceState
      )
    ],
    ['test', CORE_SKILLS.jest]
  ]);

  const defaultSubCommands: Set<string> = new Set(defaultSkillsMap.keys());
  // Create a set of subcommands that the given skill has
  const skillSubcommands: Set<string> = Array.from(skillMap.values()).reduce(
    (prev: Set<string>, skillNode: SkillNode) => {
      if (skillNode.interfaces && skillNode.interfaces.length) {
        skillNode.interfaces.forEach(_interface => {
          const { subcommand } = _interface.module;
          prev.add(subcommand);
        });
      }
      return prev;
    },
    new Set()
  );

  defaultSubCommands.forEach(defaultSubCommand => {
    if (!skillSubcommands.has(defaultSubCommand)) {
      const defaultSkillToAdd = defaultSkillsMap.get(defaultSubCommand);
      skillMap.set(defaultSkillToAdd.name, defaultSkillToAdd);
    }
  });

  // Add all the CORE_SKILL's without subcommands
  // @HACK
  if (!skillMap.has('babel')) {
    skillMap.set('babel', CORE_SKILLS.babel);
  }

  runTransforms(project, skillMap);

  validateSkill(skillMap, interfaceState);

  return skillMap;
}

/**
 * 1. Add default skills to skill
 * 2. Validate skill
 * 3. Run skill transformations
 */
export default async function skillMapFromConfig(
  project: ProjectInterface,
  interfaceState: InterfaceState,
  config: ConfigInterface = project.config
): Promise<SkillMap> {
  // Generate the skill map
  const skillMapFromConfigSkills: SkillMap = new Map();

  config.skills.forEach(([skillPkgName, skillUserConfig = {}]) => {
    // Add the skill config to the skillNode
    const skillNode: SkillNode = requireSkill(skillPkgName);
    skillNode.config = skillUserConfig;
    if (skillNode.configFiles) {
      skillNode.configFiles = skillNode.configFiles.map(configFile => ({
        ...configFile,
        config: lodash.merge(
          {},
          configFile.config,
          // Only apply config if skill has only one config file
          skillNode.configFiles.length === 1 ? skillUserConfig : {}
        )
      }));
    }
    skillMapFromConfigSkills.set(skillNode.name, skillNode);
  });

  return Skills(
    project,
    Array.from(skillMapFromConfigSkills.values()),
    interfaceState
  );
}
