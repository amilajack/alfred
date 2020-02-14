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
export type EnvShortName = 'prod' | 'dev' | 'test';

export type Platform = 'node' | 'browser';

export type ProjectEnum = 'app' | 'lib';

export type ConfigSkill = [string, ConfigValue];

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
  // All the interface states of the project
  targets: Target[];
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
  // Write each config in .configs of each skill
  writeConfigsFromSkillMap: (skillMap: SkillMap) => Promise<SkillMap>;
  // Install dependencies to a given project
  installDeps: (
    dependencies: string[] | Dependencies,
    type: DependencyType,
    npmClient?: NpmClients
  ) => Promise<void>;
  findDepsToInstall: (skills?: Skill[]) => Promise<PkgWithDeps>;
  validatePkgJson: () => ValidationResult;
}

export type Entrypoint = {
  // All the supported targets a `build` skill should build
  platform: Platform;
  // Project type
  project: ProjectEnum;
  meta?: Record<string, string>;
};

export type Target = Entrypoint & {
  // Flag name and argument types
  env: Env;
};

export type HandleFlagsArgs = { target: Target; config: ConfigInterface };

export interface SkillInterfaceModule {
  description: string;
  subcommand: string;
  runForAllTargets?: boolean;
  // @TODO Take config in misc object to allow for future additions to the API
  // @TODO Swap order of target and skills
  resolveSkill: (skills: Array<Skill>, target: Target) => Skill;
  handleFlags?: (flags: Array<string>, args: HandleFlagsArgs) => Array<string>;
}

export type RawSkillConfigValue = [string, ConfigValue];

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
  config: Record<string, any>;
}

export type UnresolvedInterfaces = Array<
  string | [string, Record<string, any>] | SkillInterface
>;
export type ResolvedInterfaces = Array<SkillInterface>;

export type ConfigValue = Record<string, any>;

export type SkillFileConditionArgs = {
  project: ProjectInterface;
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
  // The content of the file
  condition?: (args: SkillFileConditionArgs) => boolean | Promise<boolean>;
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
  // Determine if the config should be written or not
  write?: boolean;
};

export type RunEvent = {
  target: Target;
  flags: Array<string>;
  subcommand: string;
};

export type LearnEvent = {
  skillsPkgNames: Array<string>;
  flags: Array<string>;
};

export type HookArgs = {
  project: ProjectInterface;
  config: ConfigInterface;
  targets: Target[];
  skill: Skill;
  skillConfig: ConfigValue;
  skillMap: SkillMap;
  event: RunEvent | LearnEvent;
};

export type HookFn = (args: HookArgs) => void;

export type DiffDeps = { diffDevDeps: string[]; diffDeps: string[] };

export type RawSupports = {
  // Flag name and argument types
  envs?: Array<Env>;
  // All the supported targets a `build` skill should build
  platforms?: Array<Platform>;
  // Project type
  projects?: Array<ProjectEnum>;
};

export type Supports = {
  // Flag name and argument types
  envs: Array<Env>;
  // All the supported targets a `build` skill should build
  platforms: Array<Platform>;
  // Project type
  projects: Array<ProjectEnum>;
};

export type TransformArgs = {
  toSkill: Skill;
  skillMap: SkillMap;
  project: ProjectInterface;
  config: ConfigInterface;
};

export type Transforms = {
  [skillName: string]: (ownSkill: Skill, transformArgs: TransformArgs) => Skill;
};

export interface VirtualFileSystemInterface
  extends Map<string, VirtualFileInterface> {
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

export interface RawSkill {
  name: string;
  description?: string;
  supports?: RawSupports;
  pkg?: PkgJson;
  devDependencies?: Dependencies;
  dependencies?: Dependencies;
  dirs?: Array<Dir>;
  files?: Array<SkillFile>;
  configs?: Array<SkillConfig>;
  interfaces?: UnresolvedInterfaces;
  hooks?: Hooks;
  transforms?: Transforms;
  default?: boolean;
}

export type Dir = {
  src: string;
  dest: string;
};

export interface SkillWithoutHelpers extends PkgWithDeps {
  name: string;
  description: string;
  pkg: PkgJson;
  // Not all skills are required to register a subcommand (react for example)
  subcommand?: string;
  supports: Supports;
  dirs: Array<Dir>;
  files: VirtualFileSystemInterface;
  configs: EnhancedMap<string, SkillConfig>;
  interfaces: Array<SkillInterface>;
  hooks: Hooks;
  transforms: Transforms;
  default: boolean;
  userConfig: Record<string, any>;
}

export type SkillMap = Map<string, Skill>;

export type Skill = SkillWithoutHelpers & {
  findConfig: (configName: string) => SkillConfig;
  extendConfig: (configName: string, configExtension: ConfigValue) => Skill;
  replaceConfig: (configName: string, configReplacement: ConfigValue) => Skill;
  setWrite: (configName: string, shouldWrite: boolean) => Skill;
  addDeps: (pkg: Dependencies) => Skill;
  addDevDeps: (pkg: Dependencies) => Skill;
  addDepsFromPkg: (
    pkgs: string | string[],
    pkg?: PkgJson,
    fromPkgType?: DependencyType,
    toPkgType?: DependencyType
  ) => Skill;
};

export interface Helpers<T> {
  findConfig: (configName: string) => SkillConfig;
  extendConfig: (configName: string, configExtension: ConfigValue) => T;
  replaceConfig: (configName: string, configReplacement: ConfigValue) => T;
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

export type ValidationResult = {
  warnings: string[];
  errors: string[];
  recommendations: string[];
  messagesCount: number;
  criticalMessage: string;
};
