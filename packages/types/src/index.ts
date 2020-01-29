export type Dependencies = {
  [x: string]: string;
};

export type DependencyType = 'dev' | 'dep' | 'peer';

export type DependencyTypeFull =
  | 'peerDependencies'
  | 'devDependencies'
  | 'dependencies';

export interface PkgJson extends JSON {
  devDependencies?: Dependencies;
  dependencies?: Dependencies;
  peerDependencies?: Dependencies;
  alfred?: ConfigWithUnresolvedInterfaces;
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

export interface ProjectInterface {
  // The path to the root directory of the project
  root: string;
  // The `Config` that corresponds to the project
  config: ConfigInterface;
  // The value of the root package.json
  pkg: PkgJson;
  // The path to the root package.json
  pkgPath: string;
  // Get the list of subcommands which correspond to which skills of a given alfred project
  skills: () => Promise<SkillsList>;
  // Config setter method
  setConfig: (config: ConfigInterface) => void;
  // Create a skill from a given interface state
  skillMapFromInterfaceState: (i: InterfaceState) => Promise<SkillMap>;
  // Write each config in .configFiles of each skill
  writeConfigsFromSkillMap: (skillMap: SkillMap) => Promise<SkillMap>;
  // Install dependencies to a given project
  installDeps: (
    dependencies: string[] | Dependencies,
    type: DependencyType,
    npmClient?: NpmClients
  ) => Promise<void>;
  findDepsToInstall: (skillNodes?: SkillNode[]) => Promise<PkgWithDeps>;
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
export interface ConfigWithResolvedSkills {
  skills?: ConfigSkills;
  npmClient?: NpmClients;
  configsDir?: string;
  showConfigs?: boolean;
  autoInstall?: boolean;
}

// Interface should be resolved before skills are resolved, so extends is not included
export interface ConfigWithUnresolvedSkills {
  skills?: RawSkillConfigValue[];
  npmClient?: NpmClients;
  showConfigs?: boolean;
  configsDir?: string;
  autoInstall?: boolean;
}

export interface ConfigWithUnresolvedInterfaces
  extends ConfigWithUnresolvedSkills {
  extends?: RawExtendsConfigValue;
}

export interface ConfigWithDefaults {
  skills: ConfigSkills;
  npmClient: NpmClients;
  configsDir: string;
  showConfigs: boolean;
  autoInstall: boolean;
}

export interface ConfigInterface extends ConfigWithDefaults {
  getConfigWithDefaults: () => ConfigWithDefaults;
  getConfigValues: () => ConfigWithResolvedSkills;
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

export type ConfigFile = {
  // The "friendly name" of a file. This is the name that
  // other skills will refer to config file by.
  name: string;
  // The relative path of the file the config should be written to
  path: string;
  // The value of the config
  config: ConfigValue;
  // The type of the config file. Defaults to 'json'
  fileType: 'module' | 'string' | 'json';
  configValue: 'module' | 'string' | 'json';
  // Allow the config to be written to user's `./configs` directory
  write: boolean;
};

export type HooksCallArgs = {
  project: ProjectInterface;
  configFiles: Array<ConfigFile>;
  config: ConfigInterface;
  interfaceState: InterfaceState;
  subcommand: string;
  skillConfig: ConfigValue;
  skillMap: SkillMap;
  flags: Array<string>;
};

export type CallFn = (args: HooksCallArgs) => void;

export type DiffDeps = { diffDevDeps: string[]; diffDeps: string[] };

export interface Skill extends PkgWithDeps {
  name: string;
  description: string;
  pkg?: PkgJson;
  supports?: {
    // Flag name and argument types
    env: Array<'production' | 'development' | 'test'>;
    // All the supported targets a `build` skill should build
    targets: Array<'browser' | 'node' | 'electron' | 'react-native'>;
    // Project type
    projectTypes: Array<'lib' | 'app'>;
  };
  configFiles: Array<ConfigFile>;
  config: ConfigFile;
  interfaces: Array<SkillInterface>;
  hooks: {
    call: CallFn;
  };
  ctfs: {
    [skillName: string]: (
      ownSkillNode: Skill,
      misc: {
        toSkill: Skill;
        skillMap: SkillMap;
        project: ProjectInterface;
        config: ConfigInterface;
        configsPath: string;
      }
    ) => Skill;
  };
}

interface SkillUsingInterface extends Skill {
  subcommand: string;
}

export type SkillNode = Skill | SkillUsingInterface;

export type SkillMap = Map<string, SkillNode>;

export interface SkillWithHelpers extends Skill {
  findConfig: (configName: string) => ConfigFile;
  addDependencies: (pkg: Dependencies) => SkillWithHelpers;
  addDevDependencies: (pkg: Dependencies) => SkillWithHelpers;
  extendConfig: (x: string) => SkillWithHelpers;
  replaceConfig: (x: string, configReplacement: ConfigFile) => SkillWithHelpers;
  addDepsFromPkg: (
    pkgs: string | string[],
    pkg?: PkgJson,
    fromPkgType?: DependencyType,
    toPkgType?: DependencyType
  ) => SkillWithHelpers;
}

export type ValidationResult = {
  warnings: string[];
  errors: string[];
  recommendations: string[];
  messagesCount: number;
  criticalMessage: string;
};
