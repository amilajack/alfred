import { Pkg, ValidationResult } from './types';
declare type Person = {
    name: string;
    email: string;
    url: string;
    web?: string;
};
declare type MailToObj = {
    email: string;
    mail: string;
    url: string;
    web: string;
};
declare type Obj = {
    type: string;
    url: string;
};
export declare class PkgValidation {
    static packageFormat: RegExp;
    static versionFormat: RegExp;
    static urlFormat: RegExp;
    static emailFormat: RegExp;
    static getSpecMap(): {
        name: {
            type: string;
            required: boolean;
            format: RegExp;
        };
        version: {
            type: string;
            required: boolean;
            format: RegExp;
        };
        description: {
            type: string;
            warning: boolean;
        };
        keywords: {
            type: string;
            warning: boolean;
        };
        homepage: {
            type: string;
            recommended: boolean;
            format: RegExp;
        };
        bugs: {
            warning: boolean;
            validate: typeof PkgValidation.validateUrlOrMailto;
        };
        licenses: {
            type: string;
            warning: boolean;
            validate: typeof PkgValidation.validateUrlTypes;
            or: string;
        };
        license: {
            type: string;
        };
        author: {
            validate: typeof PkgValidation.validatePeople;
        };
        contributors: {
            validate: typeof PkgValidation.validatePeople;
        };
        files: {
            type: string;
        };
        main: {
            type: string;
        };
        bin: {
            types: string[];
        };
        man: {
            types: string[];
        };
        directories: {
            type: string;
        };
        repository: {
            types: string[];
            warning: boolean;
            validate: typeof PkgValidation.validateUrlTypes;
            or: string;
        };
        scripts: {
            type: string;
        };
        config: {
            type: string;
        };
        dependencies: {
            type: string;
            validate: typeof PkgValidation.validateDependencies;
        };
        devDependencies: {
            type: string;
            validate: typeof PkgValidation.validateDependencies;
        };
        bundledDependencies: {
            type: string;
        };
        bundleDependencies: {
            type: string;
        };
        optionalDependencies: {
            type: string;
            validate: typeof PkgValidation.validateDependencies;
        };
        engines: {
            type: string;
            recommended: boolean;
        };
        engineStrict: {
            type: string;
        };
        os: {
            type: string;
        };
        cpu: {
            type: string;
        };
        preferGlobal: {
            type: string;
        };
        private: {
            type: string;
        };
        publishConfig: {
            type: string;
        };
    };
    static parse(data: string | Object): Object | string;
    static validate(data: string | Pkg, options?: {
        recommendations: boolean;
        warnings: boolean;
    }): ValidationResult;
    static validateType(name: string, a: {
        types: Array<string>;
        type: string;
    }, value: any): string[];
    static validateDependencies(name: string, deps: {
        [dep: string]: string;
    }): string[];
    static isValidVersionRange(version: string): boolean;
    static validateUrlOrMailto(name: string, obj: MailToObj): string[];
    static validatePerson(person: Person | string, errors?: Array<string>, name?: string): void;
    static validatePeople(name: string, obj: Array<Person> | Person): Array<string>;
    static validateUrlTypes(name: string, obj: string | Obj | Obj[]): string[];
}
export default function Validateconfig(config: {
    [x: string]: any;
}): void | {
    [x: string]: any;
};
export {};
//# sourceMappingURL=validation.d.ts.map