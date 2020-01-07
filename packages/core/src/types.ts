// @TODO Use a proper JSON typing here
export type Pkg = JSON;

export type StringPkg = {
  [x: string]: string
}

export type Env = 'production' | 'development' | 'test';

export type Target = 'node' | 'browser';

export type ProjectEnum = 'app' | 'lib';

export type Skill = [string, any] | string;

export type NpmClients = 'yarn' | 'npm' | 'writeOnly';

export interface ResolvedConfigInterface {
  npmClient: NpmClients;
  skills: Array<Skill>;
  showConfigs: boolean;
  autoInstall: boolean;
}

export interface UnresolvedConfigInterface extends ResolvedConfigInterface {
  extends: Array<string> | string;
}

export interface ConfigInterface extends ResolvedConfigInterface {
  getConfigWithDefaults: () => UnresolvedConfigInterface
  getConfigValues: () => UnresolvedConfigInterface
}

export interface ProjectInterface {
  root: string;
  config: ConfigInterface;
  pkg: Pkg;
  pkgPath: string;
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
  resolveSkill?: (ctfs: Array<CtfNode>, interfaceState: InterfaceState) => CtfNode | false;
  handleFlags?: (flags: Array<string>, interfaceState: InterfaceState) => Array<string>;
}

export interface SkillInterface {
  name: string;
  module: SkillInterfaceModule;
}

export type RawInterfaceInput = Array<
  string | [string, { [x: string]: string }]
>;
export type InterfaceInput = Array<[string, SkillInterface]>;
export type NormalizedInterfaces = Array<{
  name: string,
  module: NodeJS.Module
}>;

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
  // Allow the config to be written to user's `./configs` directory
  write: boolean
};

type HooksCallArgs = {
  project: ProjectInterface,
  configFiles: Array<ConfigFile>,
  config: ConfigInterface,
  interfaceState: InterfaceState,
  subcommand: string,
  skillConfig: ConfigValue,
  ctf: CtfMap,
  flags: Array<string>
};

export type UsingInterface = {
  interfaces: Array<SkillInterface>,
  subcommand: string,
  hooks: {
    call: (args: HooksCallArgs) => string;
    install?: () => void
  }
};

type RequiredCtfNodeParams = {
  name: string,
  dependencies: {
    [x: string]: any
  },
  devDependencies: {
    [x: string]: any
  },
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
    call: (args: HooksCallArgs) => Promise<void>;
  },
  ctfs: {
    [x: string]: (
      a: RequiredCtfNodeParams,
      b: Map<string, RequiredCtfNodeParams>
    ) => RequiredCtfNodeParams
  }
};

export type CtfNode =
  | RequiredCtfNodeParams
  | RequiredCtfNodeParams & UsingInterface

export type CtfMap = Map<string, CtfNode>;

export interface CtfHelpers {
  findConfig: (configName: string) => ConfigFile;
  addDependencies: (pkg: StringPkg) => StringPkg;
  addDevDependencies: (pkg: StringPkg) => StringPkg;
  extendConfig: (x: string) => CtfNode;
  replaceConfig: (x: string, configReplacement: ConfigValue) => CtfNode
}
