import { EventEmitter } from 'events';

export type Dependencies = {
  [x: string]: string;
};

export type DependencyType = 'dev' | 'dep' | 'peer';

export type DependencyTypeFull =
  | 'peerDependencies'
  | 'devDependencies'
  | 'dependencies';

export interface PkgJson {
  devDependencies?: Dependencies;
  dependencies?: Dependencies;
  peerDependencies?: Dependencies;
  alfred?: AlfredConfigWithUnresolvedInterfaces;
}

export interface PkgWithDeps {
  devDependencies: Dependencies;
  dependencies: Dependencies;
}

export interface PkgWithAllDeps {
  peerDependencies: Dependencies;
  devDependencies: Dependencies;
  dependencies: Dependencies;
}

export type Env = 'production' | 'development' | 'test';

export type Target = 'node' | 'browser';

export type ProjectEnum = 'app' | 'lib';

export type ConfigSkill = [string, any];

export type ConfigSkills = ConfigSkill[];

export type NpmClients = 'yarn' | 'npm' | 'writeOnly';

export type SkillsForSubCommand = Map<string, Set<string>>;
export type SubCommandDict = Map<string, SkillInterface>;

export type SkillsList = {
  subCommandAndSkills: SkillsForSubCommand;
  subCommandDict: SubCommandDict;
};

export interface ProjectInterface extends EventEmitter {
  // The path to the root directory of the project
  root: string;
  // The `Config` that corresponds to the project
  config: ConfigInterface;
  // The value of the root package.json
  pkg: PkgJson;
  // The path to the root package.json
  pkgPath: string;
  // Initialize an alfred project
  init: () => Promise<ProjectInterface>;
  // Get the list of subcommands which correspond to which skills of a given alfred project
  skills: () => Promise<SkillsList>;
  learn: (skillPkgNames: string[]) => Promise<void>;
  run: (
    subcommand: string,
    skillFlags?: string[]
  ) => Promise<void | SkillsList>;
  // Config setter method
  setConfig: (config: ConfigInterface) => void;
  // Get skill map
  getSkillMap: () => Promise<SkillMap>;
  // Create a skill from a given interface state
  getSkillMapFromInterfaceState: (i: InterfaceState) => Promise<SkillMap>;
  // Write each config in .configs of each skill
  writeConfigsFromSkillMap: (skillMap: SkillMap) => Promise<SkillMap>;
  // Install dependencies to a given project
  installDeps: (
    dependencies: string[] | Dependencies,
    type: DependencyType,
    npmClient?: NpmClients
  ) => Promise<void>;
  findDepsToInstall: (skillNodes?: SkillNode[]) => Promise<PkgWithDeps>;
  validatePkgJson: () => ValidationResult;
}

export type InterfaceState = {
  // Flag name and argument types
  env: Env;
  // All the supported targets a `build` skill should build
  target: Target;
  // Project type
  projectType: ProjectEnum;
};

export interface SkillInterfaceModule extends NodeJS.Module {
  description: string;
  subcommand: string;
  runForAllTargets?: boolean;
  // @TODO Take config in misc object to allow for future additions to the API
  // @TODO Swap order of interfaceState and skills
  resolveSkill?: (
    skills: Array<SkillWithHelpers>,
    interfaceState: InterfaceState
  ) => SkillWithHelpers | false;
  handleFlags?: (
    flags: Array<string>,
    misc: { interfaceState: InterfaceState; config: ConfigInterface }
  ) => Array<string>;
}

export type RawSkillConfigValue = [string, Record<string, any>] | string;

export type RawExtendsConfigValue = Array<string> | string;

// Interface should be resolved before skills are resolved, so extends is not included
export interface AlfredConfigWithResolvedSkills {
  skills?: ConfigSkills;
  npmClient?: NpmClients;
  configsDir?: string;
  showConfigs?: boolean;
  autoInstall?: boolean;
}

// Interface should be resolved before skills are resolved, so extends is not included
export interface AlfredConfigWithUnresolvedSkills {
  skills?: RawSkillConfigValue[];
  npmClient?: NpmClients;
  showConfigs?: boolean;
  configsDir?: string;
  autoInstall?: boolean;
}

export interface AlfredConfigWithUnresolvedInterfaces
  extends AlfredConfigWithUnresolvedSkills {
  extends?: RawExtendsConfigValue;
}

export interface AlfredConfigWithDefaults {
  skills: ConfigSkills;
  npmClient: NpmClients;
  configsDir: string;
  showConfigs: boolean;
  autoInstall: boolean;
}

export interface ConfigInterface extends AlfredConfigWithDefaults {
  getConfigWithDefaults: () => AlfredConfigWithDefaults;
  getConfigValues: () => AlfredConfigWithResolvedSkills;
}

export interface SkillInterface {
  name: string;
  module: SkillInterfaceModule;
}

export type UnresolvedInterfaces = Array<
  string | [string, { [x: string]: string }] | SkillInterface
>;
export type ResolvedInterfaces = Array<SkillInterface>;

export type ConfigValue =
  | string
  | {
      [x: string]: any;
    };

export type SkillFile = {
  // The "friendly name" of a file. This is the name that
  // other skills will refer to config file by.
  alias?: string;
  // The absolute path of the file
  src?: string;
  // The relative path of the file the config should be written to
  dest: string;
  // The content of the file
  content?: string;
};

export type FileType = 'commonjs' | 'module' | 'json';

export interface EnhancedMap<K, V> extends Map<K, V> {
  map(fn: (item: V, idx: number, items: [K, V][]) => V): EnhancedMap<K, V>;
}

export type SkillConfig = {
  // The "friendly name" of a file. This is the name that
  // other skills will refer to config file by.
  alias: string;
  // The relative path of the file the config should be written to
  filename: string;
  // The value of the config
  config: ConfigValue;
  // The type of the config file. This is inferred by alfred by the file extension of .path
  fileType?: FileType;
};

export type HooksArgs = {
  project: ProjectInterface;
  config: ConfigInterface;
  interfaceState?: InterfaceState;
  interfaceStates?: InterfaceState[];
  data: {
    skillsPkgNames?: Array<string>;
    flags?: Array<string>;
    subcommand?: string;
  };
  skill: SkillNode;
  skillConfig: ConfigValue;
  skillMap: SkillMap;
};

export type HookFn = (args: HooksArgs) => void;

export type DiffDeps = { diffDevDeps: string[]; diffDeps: string[] };

export type Supports = {
  // Flag name and argument types
  envs: Array<'production' | 'development' | 'test'>;
  // All the supported targets a `build` skill should build
  targets: Array<'browser' | 'node' | 'electron' | 'react-native'>;
  // Project type
  projectTypes: Array<'lib' | 'app'>;
};

export type Transforms = {
  [skillName: string]: (
    ownSkillNode: Skill,
    misc: {
      toSkill: Skill;
      skillMap: SkillMap;
      project: ProjectInterface;
      config: ConfigInterface;
    }
  ) => Skill;
};

export interface VirtualFileSystemInterface extends Map<string, SkillFile> {
  add(file: SkillFile): VirtualFileSystemInterface;
  writeAllFiles(project: ProjectInterface): Promise<void>;
}

export interface VirtualFileInterface extends SkillFile {
  write(content: string): VirtualFileInterface;
  move(filename: string): VirtualFileInterface;
  delete(): void;
  rename(filename: string): VirtualFileInterface;
  replace(content: string): VirtualFileInterface;
  applyDiff(diff: string): VirtualFileInterface;
  replaceContent(
    searchValue: string | RegExp,
    replaceValue: string
  ): VirtualFileInterface;
}

export type CORE_SKILL =
  | 'webpack'
  | 'babel'
  | 'parcel'
  | 'eslint'
  | 'prettier'
  | 'jest'
  | 'react'
  | 'rollup'
  | 'lodash';

export type Hooks = {
  run?: HookFn;
  beforeLearn?: HookFn;
  afterLearn?: HookFn;
  beforeTransforms?: HookFn;
  afterTransforms?: HookFn;
};

export interface RawSkill extends PkgWithDeps {
  name: string;
  description: string;
  supports: Supports;
  pkg: PkgJson;
  dirs?: Array<Dir>;
  files?: Array<SkillFile>;
  configs?: Array<SkillConfig>;
  userConfig?: SkillConfig;
  interfaces?: Array<SkillInterface>;
  hooks?: Hooks;
  transforms?: Transforms;
}

export type Dir = {
  src: string;
  dest: string;
};

export interface Skill extends PkgWithDeps {
  name: string;
  description: string;
  pkg: PkgJson;
  supports: Supports;
  dirs: Array<Dir>;
  files: VirtualFileSystemInterface;
  configs: EnhancedMap<string, SkillConfig>;
  userConfig: SkillConfig;
  interfaces: Array<SkillInterface>;
  hooks: Hooks;
  transforms: Transforms;
}

export interface SkillUsingInterface extends Skill {
  subcommand: string;
}

export type SkillNode = Skill | SkillUsingInterface;

export type SkillMap = Map<string, SkillNode>;

export interface Helpers<T> {
  findConfig: (configName: string) => SkillConfig;
  extendConfig: (x: string) => T;
  replaceConfig: (x: string, configReplacement: SkillConfig) => T;
  setWrite: (configName: string, shouldWrite: boolean) => T;
  addDeps: (pkg: Dependencies) => T;
  addDevDeps: (pkg: Dependencies) => T;
  addDepsFromPkg: (
    pkgs: string | string[],
    pkg?: PkgJson,
    fromPkgType?: DependencyType,
    toPkgType?: DependencyType
  ) => T;
}

export interface RawSkillWithHelpers
  extends Helpers<RawSkillWithHelpers>,
    RawSkill {}
export interface SkillWithHelpers extends Helpers<SkillWithHelpers>, Skill {}

export type ValidationResult = {
  warnings: string[];
  errors: string[];
  recommendations: string[];
  messagesCount: number;
  criticalMessage: string;
};
