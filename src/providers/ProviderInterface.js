// @flow
export interface ProviderResponse {
  providerName: string;

  /**
   * Ideally we could return an AST from here but we can only
   * do that if all the providers use the same AST. Can yield
   * better performance if we do this
   */
  stdBuffer: Buffer;

  text: string
}

export type ProviderInput = {
  packageJsonPath: string,
  verbose: bool,
  files: Array<string>
};

export interface ProviderInterface {
  providerName: string;

  priority: number,

  /**
   * @private
   */
  transform: (files: Array<string>) => Promise<void>,

  /**
   * This method allows providers to be used as monads
   */
  provide: (input: ProviderInput) => Promise<ProviderInput>;
}
