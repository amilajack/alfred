// @flow
import path from 'path';
import Providers, { writeFileAsync, readFileAsync } from '../src/providers';

describe('Migrate', () => {
  it('should migrate basic file', async () => {
    const tmpFile = path.join(__dirname, 'moo.ts');
    const result = await Providers({
      files: [tmpFile],
      packageJsonPath: __dirname,
      unsafe: false,
      verbose: true,
      write: false
    });
    expect(result).toMatchSnapshot();
  });
});
