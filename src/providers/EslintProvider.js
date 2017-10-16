// @flow
import { Linter } from 'eslint';
import { readFileAsync, writeFileAsync } from './';
import type { ProviderInput, ProviderInterface } from './ProviderInterface';

export default class EslintProvider implements ProviderInterface {
  providerName = 'eslint';

  priority = 10;

  safe = true;

  /**
   * @private
   */
  linter: {
    verifyAndFix: (code: string, config: { extends: string }) => ({
      fixed: bool,
      output: string,
      messages: Array<string>
    })
  } = new Linter();

  async transform(input: ProviderInput) {
    await Promise.all(input.files.map(file => readFileAsync(file).then((result) => {
      let transformedCode = result.toString();

      // Multiple pass transformation. Sometimes it takes eslint multiple passes to autofix
      // all the errors it can
      for (let i = 0; i < 3; i++) {
        transformedCode = this.linter.verifyAndFix(transformedCode, {
          extends: 'bliss',
          parser: 'babel-eslint',
          ecmaFeatures: {
            modules: true
          },
          parserOptions: {
            ecmaVersion: 6,
            sourceType: 'module',
            ecmaFeatures: {
              modules: true
            }
          },
          rules: {
            semi: 2
          }
        }).output;
      }

      return writeFileAsync(file, transformedCode);
    })));
  }

  async provide(input: ProviderInput): Promise<ProviderInput> {
    await this.transform(input);
    return input;
  }
}
