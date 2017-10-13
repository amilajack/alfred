// @flow
import lebab from 'lebab';
import fs from 'fs';
import util from 'util';
import type { ProviderInput, ProviderInterface } from './ProviderInterface';

const readFileAsync = util.promisify(fs.readFile);

export default class LebabProvider implements ProviderInterface {
  /**
   * The list of transforms to apply
   * @private
   */
  transforms: { [property: string]: bool } = {
    arrow: true
  };

  providerName = 'lebab';

  priority = 10;

  /**
   * @private
   */
  async transform(files: Array<string>) {
    await Promise.all(files.map(file =>
      readFileAsync(file).then(buffer => lebab.transform(
        buffer.toString(),
        Object.keys(this.transforms).filter(transform => transform in this.transforms)
      ))));
  }

  async provide(input: ProviderInput): Promise<ProviderInput> {
    await this.transform(input.files);
    return input;
  }
}
