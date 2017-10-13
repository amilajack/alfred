// @flow
export type ProviderInput = {
  packageJsonPath: string,
  files: Array<string>,
  unsafe: bool,
  verbose: bool,
  write: bool
};

export interface ProviderInterface {
  providerName: string;

  priority: number,

  safe: bool,

  /**
   * @private
   */
  transform: (files: Array<string>) => Promise<void>,

  /**
   * This method allows providers to be used as monads
   */
  provide: (input: ProviderInput) => Promise<ProviderInput>;
}
