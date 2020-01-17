declare module 'format-package' {
  export default function formatPkg(
    pkg: Record<string, any>,
    opts?: Record<string, any>
  ): Promise<Record<string, any>>;
}

type ValidLicenseResult = {
  validForNewPackages: boolean;
  validForOldPackages: boolean;
  spdx?: boolean;
  errors?: string[];
  warnings?: string[];
};

declare module 'validate-npm-package-license' {
  export default function validateLicense(license: string): ValidLicenseResult;
}

type ValidPkgNameResult = {
  validForNewPackages: boolean;
  validForOldPackages: boolean;
  errors?: string[];
  warnings?: string[];
};

declare module 'validate-npm-package-name' {
  export default function validate(pkgName: string): ValidPkgNameResult;
}

declare module 'git-config' {
  export type GitConfig = {
    user: {
      name: string;
      email: string;
    };
  };
  export default function gitConfig(
    cb: (err?: Error, config?: GitConfig) => void
  ): Promise<GitConfig>;
}
