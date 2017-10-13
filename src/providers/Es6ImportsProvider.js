// @flow
import { spawn } from 'child-process-promise';
import type { ProviderInput, ProviderInterface } from './ProviderInterface';

export default class Es6ImportsProvider implements ProviderInterface {
  providerName = 'es6-imports'

  priority = 0;

  safe = true;

  /**
   * @private
   */
  runCodeshift(transformName: string, files: string[]): Promise<void> {
    const cmd = require.resolve('jscodeshift/bin/jscodeshift.sh');
    const transform = require.resolve(`5to6-codemod/transforms/${transformName}`);
    const child = spawn(cmd, ['-t', transform].concat(files));

    child.progress((childProcess) => {
      childProcess.stderr.pipe(process.stderr);
    });

    return child;
  }

  /**
   * @private
   */
  async transform(files: Array<string>) {
    await this.runCodeshift('exports.js', files);
    await this.runCodeshift('cjs.js', files);
  }

  async provide(input: ProviderInput): Promise<ProviderInput> {
    await this.transform(input.files);
    return input;
  }
}
