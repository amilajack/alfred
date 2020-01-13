import { ProjectInterface, CtfMap, ConfigInterface, InterfaceState, SkillInterfaceModule } from '../types';
export declare function getInterfaceForSubcommand(ctf: CtfMap, subcommand: string): SkillInterfaceModule;
export declare type ExecutableSkillMethods = {
    [subcommand: string]: (config: ConfigInterface, flags: Array<string>) => void;
};
export declare function getExecutableWrittenConfigsMethods(project: ProjectInterface, ctf: CtfMap, interfaceState: InterfaceState): ExecutableSkillMethods;
//# sourceMappingURL=index.d.ts.map