import { Pkg, ConfigInterface, InterfaceState, ProjectInterface, ValidationResult, Skills } from './types';
export declare function formatPkgJson(pkg: Pkg): Promise<string>;
export default class Project implements ProjectInterface {
    config: ConfigInterface;
    pkgPath: string;
    pkg: Pkg;
    root: string;
    constructor(projectRootOrSubDir?: string);
    static validatePkgPath(pkgPath: string): void;
    setConfig(config: ConfigInterface): Project;
    run(subcommand: string, args?: Array<string>): Promise<any>;
    learn(args: string[]): Promise<void>;
    clean(): Promise<void>;
    skills(): Promise<Skills>;
    /**
     * Validate the package.json of the Alfred project
     */
    validatePkgJson(): ValidationResult;
    checkIsAlfredProject(interfaceStates: Array<InterfaceState>): ValidationResult;
    /**
     * Delete .configs dir of an alfred project
     */
    deleteConfigs(): Promise<void>;
}
//# sourceMappingURL=project.d.ts.map