import path from 'path';
import Providers from '../src/providers';

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

  it.skip('should fail on non-existent files', async () => {});

  it.skip('should not write files if one provider fails', async () => {});

  it.skip('should fail on non-js extensions', async () => {});

  it.skip('should fail on parsing coffeescript', async () => {});
});
