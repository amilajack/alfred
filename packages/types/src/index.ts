// @TODO Use a proper JSON typing here

export type Dependencies = {
  [x: string]: string
};

export interface PkgJson extends JSON {
  devDependencies?: Dependencies,
  dependencies?: Dependencies
}

export type Pkg = PkgJson;

export type Env = 'production' | 'development' | 'test';

export type Target = 'node' | 'browser';

export type ProjectEnum = 'app' | 'lib';

export type Skill = [string, any];

export type Skills = Skill[];

export type NpmClients = 'yarn' | 'npm' | 'writeOnly';

export type SkillsForSubCommand = Map<string, Set<string>>;
export type SubCommandDict = Map<string, SkillInterface>;

export type SkillsList = {
  subCommandAndSkills: SkillsForSubCommand,
  subCommandDict: SubCommandDict
};

export interface ProjectInterface {
  root: string;
  config: ConfigInterface;
  pkg: Pkg;
  pkgPath: string;
  skills: () => Promise<SkillsList>;
  setConfig: (config: ConfigInterface) => void
  // @TODO
  // installDeps: (
  //   dependencies: Array<string>,
  //   npmClient: 'npm' | 'yarn' | 'write',
  //   config: ConfigInterface
  // ) => void;
}

export type InterfaceState = {
  // Flag name and argument types
  env: Env,
  // All the supported targets a `build` skill should build
  target: Target,
  // Project type
  projectType: ProjectEnum
};

export interface SkillInterfaceModule extends NodeJS.Module {
  description: string;
  subcommand: string;
  runForAllTargets?: boolean;
  // @TODO Take config in misc object to allow for future additions to the API
  // @TODO Swap order of interfaceState and ctfs
  resolveSkill?: (ctfs: Array<CtfNode>, interfaceState: InterfaceState) => CtfNode | false;
  handleFlags?: (flags: Array<string>, misc: {interfaceState: InterfaceState, config: ConfigInterface}) => Array<string>;
}

export type RawSkillConfigValue = [string, Object] | string;

export type RawExtendsConfigValue = Array<string> | string;

// Interface should be resolved before skills are resolved, so extends is not included
export interface ConfigWithResolvedSkills {
  skills?: Skills;
  npmClient?: NpmClients;
  showConfigs?: boolean;
  autoInstall?: boolean;
}

// Interface should be resolved before skills are resolved, so extends is not included
export interface ConfigWithUnresolvedSkills {
  skills?: RawSkillConfigValue[];
  npmClient?: NpmClients;
  showConfigs?: boolean;
  autoInstall?: boolean;
}

export interface ConfigWithUnresolvedInterfaces extends ConfigWithUnresolvedSkills {
  extends?: RawExtendsConfigValue[];
}

export interface ConfigWithDefaults {
  skills: Skills;
  npmClient: NpmClients;
  showConfigs: boolean;
  autoInstall: boolean;
}

export interface ConfigInterface extends ConfigWithDefaults {
  getConfigWithDefaults: () => ConfigWithDefaults
  getConfigValues: () => ConfigWithResolvedSkills
}

export interface SkillInterface {
  name: string;
  module: SkillInterfaceModule;
}

export type UnresolvedInterfaces = Array<
  string | [string, { [x: string]: string }]
>;
export type ResolvedInterfaces = Array<SkillInterface>;

export type ConfigValue =
  | string
  | {
      [x: string]: any
    };

export type ConfigFile = {
  // The "friendly name" of a file. This is the name that
  // other CTFs will refer to config file by.
  name: string,
  // The relative path of the file the config should be written to
  path: string,
  // The value of the config
  config: ConfigValue,
  // The type of the config file. Defaults to 'json'
  fileType: 'module' | 'string' | 'json',
  configValue: 'module' | 'string' | 'json',
  // Allow the config to be written to user's `./configs` directory
  write: boolean
};

export type HooksCallArgs = {
  project: ProjectInterface,
  configFiles: Array<ConfigFile>,
  config: ConfigInterface,
  interfaceState: InterfaceState,
  subcommand: string,
  skillConfig: ConfigValue,
  ctf: CtfMap,
  flags: Array<string>
};

export type CallFn = (args: HooksCallArgs) => void;

interface Ctf {
  name: string,
  dependencies: Dependencies,
  devDependencies: Dependencies,
  description: string,
  supports?: {
    // Flag name and argument types
    env: Array<'production' | 'development' | 'test'>,
    // All the supported targets a `build` skill should build
    targets: Array<'browser' | 'node' | 'electron' | 'react-native'>,
    // Project type
    projectTypes: Array<'lib' | 'app'>
  },
  subcommands?: Array<string>,
  configFiles: Array<ConfigFile>,
  config: ConfigFile,
  interfaces: Array<SkillInterface>,
  hooks: {
    call: CallFn
  },
  ctfs: {
    [ctfName: string]: (
      ownCtfNode: Ctf,
      ctfMap: Map<string, Ctf>,
      misc: {
        config: ConfigInterface
      } & InterfaceState
    ) => Ctf
  },
}

interface CtfUsingInterface extends Ctf {
  interfaces: Array<SkillInterface>,
  subcommand: string,
  hooks: {
    call: CallFn;
    install?: () => void
  }
}

export type CtfNode =
  | Ctf
  | CtfUsingInterface

export type CtfMap = Map<string, CtfNode>;

export interface CtfWithHelpers extends Ctf {
  findConfig: (configName: string) => ConfigFile;
  addDependencies: (pkg: Dependencies) => CtfWithHelpers;
  addDevDependencies: (pkg: Dependencies) => CtfWithHelpers;
  extendConfig: (x: string) => CtfWithHelpers;
  replaceConfig: (x: string, configReplacement: ConfigFile) => CtfWithHelpers
}

export type ValidationResult = {
  warnings: string[],
  errors: string[],
  recommendations: string[],
  messagesCount: number,
  criticalMessage: string
}
