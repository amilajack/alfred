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
  filePaths: Array<string>
};

export interface ProviderInterface {
  providerName: string;

  priority: number,

  /**
   * Take the code to transform as a string, transform it, and
   * return a string
   */
  transform: (code: string) => string,

  provide: (input: ProviderInput) => ProviderResponse;
}
