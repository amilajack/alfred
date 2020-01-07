// @TODO Use a proper JSON typing here
export type Pkg = { [x: string]: string };

export type AlfredConfig = {
  extends: Array<string> | string,
  npmClient: 'npm' | 'yarn',
  skills: Array<string | [string, Object]>,
  root: string,
  showConfigs: boolean,
  root: string
};

export interface ConfigInterface {
  extends: Array<string> | string;
  skills: Array<string | [string, Object]>;
  showConfigs: boolean;
  npmClient: 'npm' | 'yarn';
}

export interface Project {
  config: ConfigInterface;
  pkg: Pkg;
  pkgPath: string;
  installDeps: (
    dependencies: Array<string>,
    npmClient: 'npm' | 'yarn' | 'write',
    config: ConfigInterface
  ) => void;
}

export type InterfaceState = {
  // Flag name and argument types
  env: 'production' | 'development' | 'test',
  // All the supported targets a `build` skill should build
  target: 'browser' | 'node' | 'electron' | 'react-native',
  // Project type
  projectType: 'lib' | 'app'
};

export type RawInterfaceInput = Array<
  string | [string, { [x: string]: string }]
>;
export type InterfaceInput = Array<[string, { [x: string]: string }]>;
export type NormalizedInterfaces = Array<{
  name: string,
  module: module
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

type UsingInterface = {|
  interfaces: InterfaceInput,
  subcommand: string,
  hooks: {
    call: ({
      configFiles: Array<ConfigFile>,
      config: ConfigInterface,
      alfredConfig: AlfredConfig,
      interfaceState: InterfaceState,
      subcommand: string,
      skillConfig: ConfigValue
    }) => string,
    install?: () => void
  }
|};

// @flow
type RequiredCtfNodeParams = {|
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
  interfaces: InterfaceInput,
  hooks: {
    call: ({
      configFiles: Array<ConfigFile>,
      // eslint-disable-next-line no-use-before-define
      ctf: CtfMap,
      alfredConfig: AlfredConfig,
      interfaceState: InterfaceState,
      subcommand: string,
      flags: Array<string>,
      skillConfig: any
    }) => Promise<void>
  },
  ctfs: {
    [x: string]: (
      RequiredCtfNodeParams,
      Map<string, RequiredCtfNodeParams>
    ) => RequiredCtfNodeParams
  }
|};

export type CtfNode =
  | RequiredCtfNodeParams
  | {| ...UsingInterface, ...RequiredCtfNodeParams |};

export type CtfMap = Map<string, CtfNode>;

export type CtfHelpers = {
  findConfig: (configName: string) => ConfigFile,
  addDependencies: ({ [x: string]: string }) => { [x: string]: string },
  addDevDependencies: ({ [x: string]: string }) => { [x: string]: string },
  extendConfig: (x: string) => CtfNode,
  replaceConfig: (x: string, configReplacement: ConfigValue) => CtfNode
};
