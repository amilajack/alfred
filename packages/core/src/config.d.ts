import { ConfigInterface, Skill, NpmClients, UnresolvedConfigInterface, ResolvedConfigInterface, CtfMap, InterfaceState } from './types';
export default class Config implements ConfigInterface {
    extends: string | Array<string>;
    npmClient: NpmClients;
    showConfigs: boolean;
    skills: Array<Skill>;
    autoInstall: boolean;
    static DEFAULT_CONFIG: {
        skills: never[];
        showConfigs: boolean;
    };
    constructor(config: UnresolvedConfigInterface | ResolvedConfigInterface | ConfigInterface);
    getConfigWithDefaults(): UnresolvedConfigInterface;
    getConfigValues(): UnresolvedConfigInterface;
    /**
     * Write the config to a package.json file
     * @param pkgPath - The path to the package.json file
     */
    write(pkgPath: string): Promise<string>;
    private normalizeWithResolvedSkills;
    /**
     * Initialize a config from the root directory of an alfred project
     */
    static initFromProjectRoot(projectRoot: string): Config;
    private normalizeWithResolvedConfigs;
    /**
     * Merge an object to the existing package.json and write it
     */
    static writeToPkgJson(pkgPath: string, obj: Object): Promise<string>;
    /**
     * @TODO Migrate to this API
     */
    generateCtf(interfaceState: InterfaceState): CtfMap;
}
//# sourceMappingURL=config.d.ts.map