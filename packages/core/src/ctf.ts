/* eslint import/no-dynamic-require: off */
import lodash from 'lodash';
import mergeConfigs from '@alfred/merge-configs';
import {
  ConfigInterface,
  CtfMap,
  CtfNode,
  ProjectInterface,
  InterfaceState,
  ConfigFile,
  ProjectEnum,
  Target,
  CtfWithHelpers,
  Dependencies,
  OrderedCtfTransforms,
  OrderedCtfTransformsMap,
  Transforms,
  DependencyType,
  PkgJson
} from '@alfred/types';
import {
  getDepsFromPkg,
  fromPkgTypeToFull,
  getConfigsBasePath,
  requireCtf
} from '@alfred/helpers';
import topsort from './topsort';
import { normalizeInterfacesOfSkill } from './interface';

type CORE_CTF =
  | 'webpack'
  | 'babel'
  | 'parcel'
  | 'eslint'
  | 'prettier'
  | 'jest'
  | 'react'
  | 'rollup'
  | 'lodash';

export function addCtfHelpers(ctf: CtfNode): CtfWithHelpers {
  return {
    ...ctf,
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
    ): CtfWithHelpers {
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
    ): CtfWithHelpers {
      const configFiles = this.configFiles.map(configFile =>
        configFile.name === configName ? configReplacement : configFile
      );
      return {
        ...this,
        configFiles
      };
    },
    addDependencies(dependencies: Dependencies): CtfWithHelpers {
      return lodash.merge({}, this, {
        dependencies
      });
    },
    addDevDependencies(devDependencies: Dependencies): CtfWithHelpers {
      return lodash.merge({}, this, {
        devDependencies
      });
    },
    addDepsFromPkg(
      pkgs: string | string[],
      pkg: PkgJson | undefined = ctf.pkg,
      fromPkgType: DependencyType = 'dev',
      toPkgType: DependencyType = 'dev'
    ): CtfWithHelpers {
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

function normalizeCtf(ctf: CtfNode): CtfWithHelpers {
  return {
    ...addCtfHelpers(ctf),
    interfaces: normalizeInterfacesOfSkill(ctf.interfaces)
  };
}

export const CORE_CTFS: { [ctf in CORE_CTF]: CtfWithHelpers } = {
  webpack: normalizeCtf(requireCtf('@alfred/skill-webpack')),
  babel: normalizeCtf(requireCtf('@alfred/skill-babel')),
  parcel: normalizeCtf(requireCtf('@alfred/skill-parcel')),
  eslint: normalizeCtf(requireCtf('@alfred/skill-eslint')),
  prettier: normalizeCtf(requireCtf('@alfred/skill-prettier')),
  jest: normalizeCtf(requireCtf('@alfred/skill-jest')),
  react: normalizeCtf(requireCtf('@alfred/skill-react')),
  rollup: normalizeCtf(requireCtf('@alfred/skill-rollup')),
  lodash: normalizeCtf(requireCtf('@alfred/skill-lodash'))
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

/**
 * Topologically sort the CTFs
 */
export function topsortCtfMap(ctfMap: CtfMap): Array<string> {
  const topsortGraphEdges: Array<[string, string]> = [];

  const emptyCtfs: string[] = [];

  ctfMap.forEach(ctfNode => {
    if (ctfNode.ctfs) {
      Object.keys(ctfNode.ctfs).forEach(toCtfFnName => {
        if (ctfMap.has(toCtfFnName)) {
          topsortGraphEdges.push([ctfNode.name, toCtfFnName]);
        }
      });
    } else {
      emptyCtfs.push(ctfNode.name);
    }
  });

  const sortedCtfNames = [...emptyCtfs, ...topsort(topsortGraphEdges)];

  return sortedCtfNames;
}

export function callCtfsInOrder(
  project: ProjectInterface,
  ctfMap: CtfMap
): { ctf: CtfMap; orderedSelfTransforms: OrderedCtfTransforms } {
  const topSortedCtfNames = topsortCtfMap(ctfMap);

  // All the ctfs Fns from other ctfNodes that transform each ctfNode
  const selfTransforms: OrderedCtfTransformsMap = new Map(
    topSortedCtfNames.map(ctfName => [ctfName, []])
  );

  ctfMap.forEach(ctfNode => {
    Object.entries(ctfNode.ctfs || {}).forEach(([toCtfName, ctfFn]) => {
      if (ctfMap.has(toCtfName)) {
        selfTransforms.get(ctfNode.name)?.push((): void => {
          ctfMap.set(
            ctfNode.name,
            ctfFn(ctfMap.get(ctfNode.name) as CtfNode, {
              toCtf: ctfMap.get(toCtfName) as CtfNode,
              ctfs: ctfMap,
              config: project.config,
              project,
              configsPath: getConfigsBasePath(project)
            })
          );
        });
      }
    });
  });

  const orderedSelfTransforms: OrderedCtfTransforms = topSortedCtfNames.map(
    ctfName => selfTransforms.get(ctfName) as Transforms
  );

  orderedSelfTransforms.forEach(selfTransform => {
    selfTransform?.forEach(_selfTransform => {
      _selfTransform();
    });
  });

  return { ctf: ctfMap, orderedSelfTransforms };
}

export function validateCtf(
  ctf: CtfMap,
  interfaceState: InterfaceState
): CtfMap {
  ctf.forEach(ctfNode => {
    if (ctfNode && ctfNode.supports) {
      const supports = {
        env: ctfNode.supports.env.includes(interfaceState.env),
        target: ctfNode.supports.targets.includes(interfaceState.target),
        projectType: ctfNode.supports.projectTypes.includes(
          interfaceState.projectType
        )
      };
      const { env, target, projectType } = supports;
      const isSupported = env && target && projectType;

      if (!isSupported) {
        throw new Error(
          `The "${ctfNode.name}" skill, which supports ${JSON.stringify(
            ctfNode.supports
          )}}, does not support the current environment, project type, or target, which are ${JSON.stringify(
            interfaceState
          )}`
        );
      }
    }
  });

  // Check if the CTF's can be topsorted
  topsortCtfMap(ctf);

  return ctf;
}

/**
 * Add skills to a given list of skills to ensure that the list has a complete set
 * of standard ctfs. Also remove skills that do not support the current interfaceState
 */
export function CTF(
  project: ProjectInterface,
  ctfs: Array<CtfNode>,
  interfaceState: InterfaceState
): Map<string, CtfWithHelpers> {
  const ctfMap: Map<string, CtfWithHelpers> = new Map();

  ctfs
    .map(normalizeCtf)
    .forEach(
      (
        ctfWithHelpers: CtfWithHelpers,
        _,
        ctfsWithHelpers: CtfWithHelpers[]
      ) => {
        if (ctfWithHelpers.interfaces.length) {
          ctfWithHelpers.interfaces.forEach(ctfInterface => {
            if (
              'resolveSkill' in ctfInterface.module &&
              typeof ctfInterface.module.resolveSkill === 'function'
            ) {
              if (
                ctfInterface.module.resolveSkill(
                  ctfsWithHelpers,
                  interfaceState
                ) !== false
              ) {
                ctfMap.set(ctfWithHelpers.name, ctfWithHelpers);
              }
            } else {
              ctfMap.set(ctfWithHelpers.name, ctfWithHelpers);
            }
          });
        } else {
          ctfMap.set(ctfWithHelpers.name, ctfWithHelpers);
        }
      }
    );

  // Remove skills that do not support the current interfaceState
  const ctfNodesToBeRemoved: Array<string> = [];
  ctfMap.forEach(ctfNode => {
    if (ctfNode && ctfNode.supports) {
      const supports = {
        env: ctfNode.supports.env.includes(interfaceState.env),
        target: ctfNode.supports.targets.includes(interfaceState.target),
        projectType: ctfNode.supports.projectTypes.includes(
          interfaceState.projectType
        )
      };
      const { env, target, projectType } = supports;
      const isSupported = env && target && projectType;
      if (!isSupported) {
        ctfNodesToBeRemoved.push(ctfNode.name);
      }
    }
  });
  ctfNodesToBeRemoved.forEach(ctfNodeName => {
    ctfMap.delete(ctfNodeName);
  });

  // Create a set of standard skills
  const defaultCtfsMap = new Map([
    ['lint', CORE_CTFS.eslint],
    ['format', CORE_CTFS.prettier],
    [
      'build',
      require('@alfred/interface-build').resolveSkill(
        Object.values(CORE_CTFS),
        interfaceState
      )
    ],
    [
      'start',
      require('@alfred/interface-start').resolveSkill(
        Object.values(CORE_CTFS),
        interfaceState
      )
    ],
    ['test', CORE_CTFS.jest]
  ]);

  const defaultSubCommands: Set<string> = new Set(defaultCtfsMap.keys());
  // Create a set of subcommands that the given CTF has
  const ctfSubcommands: Set<string> = Array.from(ctfMap.values()).reduce(
    (prev: Set<string>, ctfNode: CtfNode) => {
      if (ctfNode.interfaces && ctfNode.interfaces.length) {
        ctfNode.interfaces.forEach(_interface => {
          const { subcommand } = _interface.module;
          prev.add(subcommand);
        });
      }
      return prev;
    },
    new Set()
  );

  defaultSubCommands.forEach(defaultSubCommand => {
    if (!ctfSubcommands.has(defaultSubCommand)) {
      const defaultCtfToAdd = defaultCtfsMap.get(defaultSubCommand);
      ctfMap.set(defaultCtfToAdd.name, defaultCtfToAdd);
    }
  });

  // Add all the CORE_CTF's without subcommands
  // @HACK
  if (!ctfMap.has('babel')) {
    ctfMap.set('babel', CORE_CTFS.babel);
  }

  callCtfsInOrder(project, ctfMap);

  validateCtf(ctfMap, interfaceState);

  return ctfMap;
}

/**
 * 1. Add default skills to CTF
 * 2. Validate CTF
 * 3. Run CTF transformations
 */
export default async function ctfFromConfig(
  project: ProjectInterface,
  interfaceState: InterfaceState,
  config: ConfigInterface = project.config
): Promise<CtfMap> {
  // Generate the CTF
  const ctfMapFromConfigSkills: CtfMap = new Map();

  config.skills.forEach(([skillPkgName, skillUserConfig = {}]) => {
    // Add the skill config to the ctfNode
    const ctfNode: CtfNode = requireCtf(skillPkgName);
    ctfNode.config = skillUserConfig;
    if (ctfNode.configFiles) {
      ctfNode.configFiles = ctfNode.configFiles.map(configFile => ({
        ...configFile,
        config: lodash.merge(
          {},
          configFile.config,
          // Only apply config if skill has only one config file
          ctfNode.configFiles.length === 1 ? skillUserConfig : {}
        )
      }));
    }
    ctfMapFromConfigSkills.set(ctfNode.name, ctfNode);
  });

  return CTF(
    project,
    Array.from(ctfMapFromConfigSkills.values()),
    interfaceState
  );
}
