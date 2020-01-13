/// <reference types="node" />
import { ConfigFile, ConfigValue, CtfMap } from '@alfred/core/src/types';
/**
 * Get the root of a project from the current working directory
 */
export declare function findProjectRoot(startingSearchDir?: string): string;
export declare function getConfigByConfigName(configName: string, configFiles: Array<ConfigFile>): ConfigFile;
export declare function getConfigPathByConfigName(configName: string, configFiles: Array<ConfigFile>): string;
/**
 * Map the environment name to a short name, which is one of ['dev', 'prod', 'test']
 */
export declare function mapEnvToShortName(envName: string): string;
export declare function mapShortNameEnvToLongName(envName: string): string;
export declare function getConfigs(ctf: CtfMap): Array<ConfigValue>;
export declare function getConfigsBasePath(projectRoot: string): string;
export declare function requireConfig(configName: string): any;
/**
 * Get the name of the package JSON
 * @param pkgName - The name of the package
 * @param binName - The property of the bin object that we want
 */
export declare function getPkgBinPath(pkgName: string, binName: string): Promise<string>;
export declare function execCommand(cmd: string): Buffer;
export declare function openInBrowser(url: string, browser: any): Promise<void>;
//# sourceMappingURL=index.d.ts.map