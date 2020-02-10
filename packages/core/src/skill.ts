/* eslint import/no-dynamic-require: off */
import path from 'path';
import lodash from 'lodash';
import mergeConfigs from '@alfred/merge-configs';
import {
  ConfigInterface,
  SkillMap,
  SkillNode,
  ProjectInterface,
  InterfaceState,
  SkillConfigFile,
  ProjectEnum,
  Target,
  SkillWithHelpers,
  Dependencies,
  DependencyType,
  PkgJson,
  CORE_SKILL,
  FileType,
  Skill,
  RawSkill,
  SkillFile
} from '@alfred/types';
import {
  getDepsFromPkg,
  fromPkgTypeToFull,
  getConfigsBasePath
} from '@alfred/helpers';
import VirtualFileSystem from './virtual-file';
import { normalizeInterfacesOfSkill } from './interface';

export function addSkillHelpers(skill: Skill): SkillWithHelpers {
  return {
    ...skill,
    findConfig(configName: string): SkillConfigFile {
      const config = (this.configFiles || []).find(
        configFile => configFile.alias === configName
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
      const configFiles = (this.configFiles || []).map(configFile =>
        configFile.alias === configName ? mergedConfigFile : configFile
      );
      return lodash.merge({}, this, {
        configFiles
      });
    },
    replaceConfig(
      configName: string,
      configReplacement: SkillConfigFile
    ): SkillWithHelpers {
      const configFiles = (this.configFiles || []).map(configFile =>
        configFile.alias === configName ? configReplacement : configFile
      );
      return {
        ...this,
        configFiles
      };
    },
    setWrite(configName: string, shouldWrite: boolean): SkillWithHelpers {
      const newConfig = {
        ...this.findConfig(configName),
        write: shouldWrite
      };
      return this.replaceConfig(configName, newConfig);
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

/**
 * This function is kept async in order to allow transforms to be async in the future. Keeping
 * it async now will allow for easier migration to async skill transforms in the future without
 * the need for breaking changes.
 */
export async function runTransforms(
  project: ProjectInterface,
  skillMap: SkillMap
): Promise<SkillMap> {
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

/**
 * @TODO Change skill param to be RawSkill instead of Skill | RawSkill
 */
function normalizeSkill(skill: Skill | RawSkill): SkillWithHelpers {
  return {
    ...addSkillHelpers(skill as Skill),
    interfaces: normalizeInterfacesOfSkill((skill as Skill).interfaces),
    files:
      skill.files instanceof VirtualFileSystem
        ? skill.files
        : new VirtualFileSystem((skill.files as SkillFile[]) || [], skill.dirs),
    configFiles: (skill.configFiles || []).map(configFile => ({
      ...configFile,
      fileType: configFile.fileType || getFileTypeFromFile(configFile.filename)
    }))
  };
}

export function requireSkill(skillName: string): SkillWithHelpers {
  try {
    const requiredSkill = {
      ...require(skillName),
      pkg: require(`${skillName}/package.json`),
      devDependencies: require(`${skillName}/package.json`).peerDependencies
    };
    return {
      ...requiredSkill,
      ...normalizeSkill(requiredSkill)
    };
  } catch (e) {
    console.log(e);
    throw new Error(`Cannot find module '${skillName}'`);
  }
}

export const CORE_SKILLS: { [skill in CORE_SKILL]: SkillWithHelpers } = {
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
    // Validate the files of a skill
    if (skillNode.files) {
      skillNode.files.forEach(file => {
        if (file.content && file.src) {
          throw new Error(
            'File cannot have both "content" and "src" properties'
          );
        }
      });
    }
    // Validate if a skill is supported for a certain interface state
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
export async function Skills(
  project: ProjectInterface,
  skills: Array<SkillNode>,
  interfaceState: InterfaceState
): Promise<Map<string, SkillWithHelpers>> {
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

  await runTransforms(project, skillMap);

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
