export type Dependencies = {
  [x: string]: string;
};

export type DependencyType = 'dev' | 'dep';

export interface PkgJson extends JSON {
  devDependencies?: Dependencies;
  dependencies?: Dependencies;
  alfred?: ConfigWithUnresolvedInterfaces;
}

export type Env = 'production' | 'development' | 'test';

export type Target = 'node' | 'browser';

export type ProjectEnum = 'app' | 'lib';

export type Skill = [string, any];

export type Skills = Skill[];

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
  // Create a CTF from a given interface state
  ctfFromInterfaceState: (i: InterfaceState) => Promise<CtfMap>;
  // Write each config in .configFiles of each skill
  writeConfigsFromCtf: (ctf: CtfMap) => Promise<CtfMap>;
  // Install dependencies to a given project
  installDeps: (
    dependencies: string[],
    type: DependencyType,
    npmClient?: NpmClients
  ) => Promise<void>;
  findDepsToInstall: (
    ctfNodes?: CtfNode[]
  ) => Promise<{ dependencies: Dependencies; devDependencies: Dependencies }>;
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
  // @TODO Swap order of interfaceState and ctfs
  resolveSkill?: (
    ctfs: Array<CtfWithHelpers>,
    interfaceState: InterfaceState
  ) => CtfWithHelpers | false;
  handleFlags?: (
    flags: Array<string>,
    misc: { interfaceState: InterfaceState; config: ConfigInterface }
  ) => Array<string>;
}

export type RawSkillConfigValue = [string, Record<string, any>] | string;

export type RawExtendsConfigValue = Array<string> | string;

// Interface should be resolved before skills are resolved, so extends is not included
export interface ConfigWithResolvedSkills {
  skills?: Skills;
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
  skills: Skills;
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
  // other CTFs will refer to config file by.
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
  ctf: CtfMap;
  flags: Array<string>;
};

export type CallFn = (args: HooksCallArgs) => void;

export type DiffDeps = { diffDevDeps: string[]; diffDeps: string[] };

export interface Ctf {
  name: string;
  dependencies: Dependencies;
  devDependencies: Dependencies;
  description: string;
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
    [ctfName: string]: (
      ownCtfNode: Ctf,
      ctfMap: Map<string, Ctf>,
      misc: {
        project: ProjectInterface;
        config: ConfigInterface;
      }
    ) => Ctf;
  };
}

interface CtfUsingInterface extends Ctf {
  subcommand: string;
}

export type CtfNode = Ctf | CtfUsingInterface;

export type CtfMap = Map<string, CtfNode>;

export interface CtfWithHelpers extends Ctf {
  findConfig: (configName: string) => ConfigFile;
  addDependencies: (pkg: Dependencies) => CtfWithHelpers;
  addDevDependencies: (pkg: Dependencies) => CtfWithHelpers;
  extendConfig: (x: string) => CtfWithHelpers;
  replaceConfig: (x: string, configReplacement: ConfigFile) => CtfWithHelpers;
}

export type Transforms = Array<() => void>;
export type OrderedCtfTransformsMap = Map<string, Transforms>;
export type OrderedCtfTransforms = Array<Transforms>;

export type ValidationResult = {
  warnings: string[];
  errors: string[];
  recommendations: string[];
  messagesCount: number;
  criticalMessage: string;
};
