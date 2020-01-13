import { InterfaceState } from '@alfred/core/src/types';
export declare type ValidPkgNameResult = {
    validForNewPackages: boolean;
    validForOldPackages: boolean;
    errors?: string[];
    warnings?: string[];
};
export declare type TemplateData = {
    project: InterfaceState;
    'alfred-pkg': {
        semver: string;
    };
};
export declare type GitConfig = {
    user: {
        name: string;
        email: string;
    };
};
export * from './helpers/parse-input';
export declare function addEntrypoints(rawTemplateData: Object, root: string, entrypointInterfaceStates: Array<InterfaceState>): Promise<void>;
export declare function addBoilerplate(templateData: TemplateData, root: string): Promise<void>;
export default function getSingleSubcommandFromArgs(args: Array<string>): string;
//# sourceMappingURL=index.d.ts.map