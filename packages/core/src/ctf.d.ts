import { ConfigInterface, CtfMap, CtfNode, ProjectInterface, InterfaceState, UnresolvedConfigInterface, ResolvedConfigInterface, CtfWithHelpers, Dependencies } from './types';
export declare const CORE_CTFS: {
    [ctf: string]: CtfWithHelpers;
};
export declare const ENTRYPOINTS: string[];
/**
 * Convert entrypoints to interface states
 */
export declare function entrypointsToInterfaceStates(entrypoints: Array<string>): Array<InterfaceState>;
/**
 * Write configs to a './.configs' directory
 */
export declare function writeConfigsFromCtf(project: ProjectInterface, ctf: CtfMap): Promise<CtfMap>;
/**
 * @TODO Account for `devDependencies` and `dependencies`
 * @TODO @REFACTOR Move to AlfredProject
 */
export declare function installDeps(dependencies: string[] | undefined, npmClient: "yarn" | "npm" | "writeOnly" | undefined, project: ProjectInterface): Promise<any>;
/**
 * Topologically sort the CTFs
 */
export declare function topsortCtfs(ctfs: CtfMap): Array<string>;
export declare function callCtfFnsInOrder(config: ConfigInterface, ctf: CtfMap, interfaceState: InterfaceState): {
    ctf: CtfMap;
    orderedSelfTransforms: ((() => void)[] | undefined)[];
};
export declare function validateCtf(ctf: CtfMap, interfaceState: InterfaceState): void;
export default function CTF(ctfs: Array<CtfNode>, interfaceState: InterfaceState): CtfMap;
/**
 * Add skills to a given list of skills to ensure that the list has a complete set
 * of standard ctfs. Also remove skills that do not support the current interfaceState
 * @REFACTOR Share logic between this and CTF(). Much duplication here
 */
export declare function addMissingStdSkillsToCtf(config: ConfigInterface, ctf: CtfMap, interfaceState: InterfaceState): CtfMap;
/**
 * @DEPRECATE
 */
export declare function generateCtfFromConfig(config: ConfigInterface, interfaceState: InterfaceState): Promise<CtfMap>;
/**
 * Intended to be used for testing purposes
 */
export declare function getDependencies(ctf: CtfMap): Dependencies;
export declare function getDevDependencies(ctf: CtfMap): Dependencies;
/**
 * Find all the dependencies that are different between two CTF's.
 * This is used to figure out which deps need to be installed by
 * finding which dependencies have changed in the package.json
 *
 * Find all the elements such that are (A ⩃ B) ⋂ B
 * where A is old ctf and B is new ctf
 */
export declare function diffCtfDeps(oldCtf: CtfMap, newCtf: CtfMap): Array<string>;
export declare function diffCtfDepsOfAllInterfaceStates(prevConfig: UnresolvedConfigInterface | ConfigInterface | ResolvedConfigInterface, currConfig: UnresolvedConfigInterface | ConfigInterface | ResolvedConfigInterface): Promise<Array<string>>;
//# sourceMappingURL=ctf.d.ts.map