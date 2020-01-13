/// <reference types="node" />
export declare type Dependencies = {
    [x: string]: string;
};
export interface PkgJson extends JSON {
    devDependencies?: Dependencies;
    dependencies?: Dependencies;
}
export declare type Pkg = PkgJson;
export declare type Env = 'production' | 'development' | 'test';
export declare type Target = 'node' | 'browser';
export declare type ProjectEnum = 'app' | 'lib';
export declare type Skill = [string, any] | string;
export declare type NpmClients = 'yarn' | 'npm' | 'writeOnly';
export declare type SubCommandAndSkills = Map<string, Set<string>>;
export declare type SubCommandDict = Map<string, SkillInterface>;
export declare type Skills = {
    subCommandAndSkills: SubCommandAndSkills;
    subCommandDict: SubCommandDict;
};
export interface ProjectInterface {
    root: string;
    config: ConfigInterface;
    pkg: Pkg;
    pkgPath: string;
    skills: () => Promise<Skills>;
    setConfig: (config: ConfigInterface) => void;
}
export declare type InterfaceState = {
    env: Env;
    target: Target;
    projectType: ProjectEnum;
};
export interface SkillInterfaceModule extends NodeJS.Module {
    description: string;
    subcommand: string;
    runForAllTargets?: boolean;
    resolveSkill?: (ctfs: Array<CtfNode>, interfaceState: InterfaceState) => CtfNode | false;
    handleFlags?: (flags: Array<string>, misc: {
        interfaceState: InterfaceState;
        config: ConfigInterface;
    }) => Array<string>;
}
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
    getConfigWithDefaults: () => UnresolvedConfigInterface;
    getConfigValues: () => UnresolvedConfigInterface;
}
export interface SkillInterface {
    name: string;
    module: SkillInterfaceModule;
}
export declare type UnresolvedInterfaces = Array<string | [string, {
    [x: string]: string;
}]>;
export declare type ResolvedInterfaces = Array<SkillInterface>;
export declare type ConfigValue = string | {
    [x: string]: any;
};
export declare type ConfigFile = {
    name: string;
    path: string;
    config: ConfigValue;
    fileType: 'module' | 'string' | 'json';
    configValue: 'module' | 'string' | 'json';
    write: boolean;
};
export declare type HooksCallArgs = {
    project: ProjectInterface;
    configFiles: Array<ConfigFile>;
    config: ConfigInterface;
    interfaceState: InterfaceState;
    subcommand: string;
    skillConfig: ConfigValue;
    ctf: CtfMap;
    flags: Array<string>;
};
export declare type CallFn = (args: HooksCallArgs) => void;
interface Ctf {
    name: string;
    dependencies: Dependencies;
    devDependencies: Dependencies;
    description: string;
    supports?: {
        env: Array<'production' | 'development' | 'test'>;
        targets: Array<'browser' | 'node' | 'electron' | 'react-native'>;
        projectTypes: Array<'lib' | 'app'>;
    };
    subcommands?: Array<string>;
    configFiles: Array<ConfigFile>;
    config: ConfigFile;
    interfaces: Array<SkillInterface>;
    hooks: {
        call: CallFn;
    };
    ctfs: {
        [ctfName: string]: (ownCtfNode: Ctf, ctfMap: Map<string, Ctf>, misc: {
            config: ConfigInterface;
        } & InterfaceState) => Ctf;
    };
}
interface CtfUsingInterface extends Ctf {
    interfaces: Array<SkillInterface>;
    subcommand: string;
    hooks: {
        call: CallFn;
        install?: () => void;
    };
}
export declare type CtfNode = Ctf | CtfUsingInterface;
export declare type CtfMap = Map<string, CtfNode>;
export interface CtfWithHelpers extends Ctf {
    findConfig: (configName: string) => ConfigFile;
    addDependencies: (pkg: Dependencies) => CtfWithHelpers;
    addDevDependencies: (pkg: Dependencies) => CtfWithHelpers;
    extendConfig: (x: string) => CtfWithHelpers;
    replaceConfig: (x: string, configReplacement: ConfigFile) => CtfWithHelpers;
}
export declare type ValidationResult = {
    warnings: string[];
    errors: string[];
    recommendations: string[];
    messagesCount: number;
    criticalMessage: string;
};
export {};
//# sourceMappingURL=types.d.ts.map