import { EventEmitter } from 'events';

export type Dependencies = {
  [pkgName: string]: string;
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
  alfred?: AlfredConfigWithUnresolvedTasks;
  [config: string]: any;
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

export type AlfredConfigSkill = [string, ConfigValue];

export type NpmClient = 'yarn' | 'npm' | 'writeOnly';

export type SubcommandFn = (
  flags?: Array<string>,
  target?: Target
) => Promise<void>;

export type ExecutableSkillMethods = Map<string, SubcommandFn>;

export type SkillsForSubCommand = Map<string, Set<string>>;
export type SubCommandDict = Map<string, SkillTask>;

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
  // All the entrypoints of the project
  entrypoints: Entrypoint[];
  // All the targets of the project
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
  // Execute events serially and wait for all events to finish
  emitAsync: (eventName: string, eventData?: HookEvent) => Promise<void>;
  // Config setter method
  setConfig: (config: ConfigInterface) => void;
  // Get skill map
  getSkillMap: () => Promise<SkillMap>;
  // Write each config in .configs of each skill
  writeSkillConfigs: (skillMap: SkillMap) => Promise<void>;
  // Write each config in .configs of each skill
  writeSkillFiles: (skills: Skill[]) => Promise<void>;
  // Install dependencies to a given project
  installDeps: (
    dependencies: string[] | Dependencies,
    type: DependencyType,
    npmClient?: NpmClient
  ) => Promise<void>;
  findDepsToInstall: (skills?: Skill[]) => Promise<PkgWithDeps>;
  validatePkgJson: () => ValidationResult;
}

export type Entrypoint = {
  // All the supported targets a `build` skill should build
  platform: Platform;
  // Project type
  project: ProjectEnum;
  // The filename of the entrypoint
  filename: string;
  meta?: Record<string, string>;
};

export type Target = {
  // All the supported targets a `build` skill should build
  platform: Platform;
  // Project type
  project: ProjectEnum;
  env: Env;
};

export type HandleFlagsArgs = { target: Target; config: ConfigInterface };

export interface SkillTaskModule {
  description: string;
  subcommand: string;
  // Determine if a skill should run once for each target it supports. This makes sense for build the
  // subcommand beacuse each target will need to have its own build. But for the lint subcommand,
  // it makes sense for this to be false because you don't need to run a linter for each target separately.
  // If this is set to true, the the `target` param of `resolveSkill` must be passed.
  runForEachTarget: boolean;
  // @TODO Change args for object to allow for future additions to the API
  resolveSkill: (skills: Array<Skill>, target?: Target) => Skill;
  // @TODO Change args for object to allow for future additions to the API
  handleFlags?: (flags: Array<string>, args: HandleFlagsArgs) => Array<string>;
}

export type AlfredConfigRawSkill = string | [string, ConfigValue];

export type RawExtendsConfigValue = Array<string> | string;

// Interface should be resolved before skills are resolved, so extends is not included
export interface AlfredConfigWithResolvedSkills {
  skills?: AlfredConfigSkill[];
  npmClient?: NpmClient;
  configsDir?: string;
  autoInstall?: boolean;
}

// Interface should be resolved before skills are resolved, so extends is not included
export interface AlfredConfigWithUnresolvedSkills {
  skills?: Array<AlfredConfigRawSkill>;
  npmClient?: NpmClient;
  configsDir?: string;
  autoInstall?: boolean;
}

export interface AlfredConfigWithUnresolvedTasks
  extends AlfredConfigWithUnresolvedSkills {
  extends?: RawExtendsConfigValue;
}

export interface AlfredConfigWithDefaults {
  skills: AlfredConfigSkill[];
  npmClient: NpmClient;
  configsDir: string;
  autoInstall: boolean;
}

export interface ConfigInterface extends AlfredConfigWithDefaults {
  getConfigWithDefaults: () => AlfredConfigWithDefaults;
  getConfigValues: () => AlfredConfigWithResolvedSkills;
}

export interface SkillTask {
  name: string;
  module: SkillTaskModule;
  config: Record<string, any>;
}

export type UnresolvedTasks = Array<
  string | [string, Record<string, any>] | SkillTask
>;
export type ResolvedTasks = Array<SkillTask>;

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
  alias?: string;
  // The relative path of the file the config should be written to
  filename: string;
  // The value of the config
  config: ConfigValue;
  // The type of the config file. This is inferred by alfred by the file extension of .path
  fileType?: FileType;
  // The name of the property which the object should be added to
  pkgProperty?: string;
  // Determine if the config should be written or not
  write?: 'file' | 'pkg' | false;
};

export type ParsedFlags = Record<string, boolean | string | number>;

export type RunEvent = {
  flags: Array<string>;
  parsedFlags: ParsedFlags;
  subcommand: string;
  output: string[];
};

export type RunForEachTargetEvent = {
  target: Target;
  flags: Array<string>;
  parsedFlags: ParsedFlags;
  subcommand: string;
  output: string;
};

export type LearnEvent = {
  skills: Skill[];
  skillsPkgNames: Array<string>;
};

export type NewEvent = {
  skillsPkgNames: Array<string>;
  skills: Skill[];
  flags: Array<string>;
};

export type TransformsEvent = {};

export type HookArgs<T> = {
  project: ProjectInterface;
  config: ConfigInterface;
  targets: Target[];
  skill: Skill;
  skillMap: SkillMap;
  event: T;
};

export type HookEvent =
  | RunEvent
  | RunForEachTargetEvent
  | LearnEvent
  | NewEvent;

export type HookFn<T> = (args: HookArgs<T>) => void | Promise<void>;

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
  replace(
    searchValueOrContent: string | RegExp,
    replaceValue: string
  ): VirtualFileInterface;
  applyDiff(diff: string): VirtualFileInterface;
}

export type CORE_SKILL =
  | 'webpack'
  | 'babel'
  | 'parcel'
  | 'eslint'
  | 'prettier'
  | 'jest'
  | 'react'
  | 'redux'
  | 'rollup'
  | 'lodash';

export type Hooks = {
  beforeRun?: HookFn<RunEvent>;
  run?: HookFn<RunEvent | RunForEachTargetEvent>;
  afterRun?: HookFn<RunEvent>;
  beforeLearn?: HookFn<LearnEvent>;
  afterNew?: HookFn<NewEvent>;
  beforeNew?: HookFn<NewEvent>;
  afterLearn?: HookFn<LearnEvent>;
  beforeTransforms?: HookFn<TransformsEvent>;
  afterTransforms?: HookFn<TransformsEvent>;
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
  tasks?: UnresolvedTasks;
  hooks?: Hooks;
  transforms?: Transforms;
  default?: boolean;
  userConfig?: Record<string, any>;
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
  tasks: Array<SkillTask>;
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
