export type ProviderInput = {
  packageJsonPath: string,
  files: Array<string>,
  unsafe: boolean,
  verbose: boolean,
  write: boolean
};

export type UserProviderInput = {
  packageJsonPath: string,
  files: Array<string>,
  unsafe: boolean,
  verbose: boolean,
  write: boolean
};

export interface ProviderInterface {
  providerName: string;

  priority: number;

  safe: boolean;

  /**
   * @private
   */
  transform: (files: Array<string>, input: ProviderInput) => Promise<void>;

  /**
   * This method allows providers to be used as monads
   */
  provide: (input: ProviderInput) => Promise<ProviderInput>;
}
