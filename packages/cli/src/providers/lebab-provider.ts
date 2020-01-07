import lebab from 'lebab';
import { readFileAsync, writeFileAsync } from '../helpers/fs';
import { ProviderInput, ProviderInterface } from './provider-interface';

export default class LebabProvider implements ProviderInterface {
  /**
   * The list of transforms to apply
   * @TODO Add more transforms
   * @private
   */
  transforms = {
    safe: [
      'arrow',
      'for-of',
      'arg-spread',
      'obj-method',
      'obj-shorthand',
      'no-strict',
      'commonjs',
      'exponent',
      'multi-var'
    ],
    unsafe: ['let', 'class', 'template', 'default-param', 'includes']
  };

  providerName = 'lebab';

  /**
   * Should run before EslintProvider and PrettierProvider. Does not follow code
   * style convention. Only focuses on upgrading code. Not code style
   */
  priority = 1;

  safe = true;

  /**
   * @private
   */
  getTransforms(input: ProviderInput) {
    return input.unsafe === true
      ? [...this.transforms.unsafe, ...this.transforms.safe]
      : this.transforms.safe;
  }

  /**
   * @private
   */
  async transform(files: Array<string>, input: ProviderInput) {
    await Promise.all(
      files.map(file =>
        readFileAsync(file).then(buffer => {
          const result = lebab.transform(
            buffer.toString(),
            this.getTransforms(input)
          );
          if (input.verbose && result.warnings.length > 0) {
            console.log(result.warnings);
          }
          return writeFileAsync(file, result.code);
        })
      )
    );
  }

  async provide(input: ProviderInput): Promise<ProviderInput> {
    await this.transform(input.files, input);
    return input;
  }
}
