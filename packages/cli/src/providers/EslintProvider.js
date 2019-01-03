// @flow
import { CLIEngine } from 'eslint';
import path from 'path';
import type { ProviderInput, ProviderInterface } from './ProviderInterface';

export default class EslintProvider implements ProviderInterface {
  providerName = 'eslint';

  priority = 10;

  safe = true;

  transform(files: Array<string>, input: ProviderInput) {
    const cli = new CLIEngine({
      configFile: path.join(__dirname, 'resources', 'alfred-eslintrc'),
      fix: true
    });

    // Sometimes it takes multiple passes for all the ESLint errors to be autofixed
    for (let i = 0; i < 3; i += 1) {
      const report = cli.executeOnFiles(input.files);
      CLIEngine.outputFixes(report);
    }

    return Promise.resolve();
  }

  async provide(input: ProviderInput): Promise<ProviderInput> {
    await this.transform(input.files, input);
    return input;
  }
}
