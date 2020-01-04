export type Pkg = { [x: string]: string };

export type AlfredConfig = {
  extends?: Array<string> | string,
  npmClient: 'npm' | 'yarn',
  skills: Array<string | [string, Object]>,
  root: string,
  showConfigs: boolean,
  projectRoot: string
};

/* eslint import/prefer-default-export: off, import/no-dynamic-require: off */
export type InterfaceState = {
  // Flag name and argument types
  env: 'production' | 'development' | 'test',
  // All the supported targets a `build` skill should build
  target: 'browser' | 'node' | 'electron' | 'react-native',
  // Project type
  projectType: 'lib' | 'app'
};

export type RawInterfaceInputType = Array<
  string | [string, { [x: string]: string }]
>;
export type InterfaceInputType = Array<[string, { [x: string]: string }]>;
export type NormalizedInterfacesType = Array<{
  name: string,
  module: module
}>;

export type configType =
  | string
  | {
      [x: string]: any
    };

export type configFileType = {
  // The "friendly name" of a file. This is the name that
  // other CTFs will refer to config file by.
  name: string,
  // The relative path of the file the config should be written to
  path: string,
  // The value of the config
  config: configType,
  // The type of the config file. Defaults to 'json'
  fileType: 'module' | 'string' | 'json',
  // Allow the config to be written to user's `./configs` directory
  write: boolean
};

type UsingInterface = {|
  interfaces: InterfaceInputType,
  subcommand: string,
  hooks: {
    call: ({
      configFiles: Array<configFileType>,
      alfredConfig: AlfredConfig,
      interfaceState: InterfaceState,
      subcommand: string,
      skillConfig: any
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
  configFiles: Array<configFileType>,
  interfaces: InterfaceInputType,
  hooks: {
    call: ({
      configFiles: Array<configFileType>,
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
  findConfig: (configName: string) => configFileType,
  addDependencies: ({ [x: string]: string }) => { [x: string]: string },
  addDevDependencies: ({ [x: string]: string }) => { [x: string]: string },
  extendConfig: (x: string) => CtfNode,
  replaceConfig: (x: string, configReplacement: configType) => CtfNode
};
