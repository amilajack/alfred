import path from 'path';
import Providers from '../src/providers';

describe('Migrate', () => {
  const defaultConfig = {
    packageJsonPath: __dirname,
    unsafe: false,
    verbose: true,
    write: false
  };

  it('should migrate basic file', async () => {
    const tmpFile = path.join(__dirname, 'moo.ts');
    const result = await Providers({
      files: [tmpFile],
      ...defaultConfig
    });
    expect(result).toMatchSnapshot();
  });

  it('should migrate basic file with EslintProvider', async () => {
    const tmpFile = path.join(__dirname, 'comma-test.ts');
    const result = await Providers({
      files: [tmpFile],
      ...defaultConfig
    });
    expect(result).toMatchSnapshot();
  });

  it.skip('should fail on non-existent files', async () => {});

  it.skip('should not write files if one provider fails', async () => {});

  it.skip('should fail on non-js extensions', async () => {});

  it.skip('should fail on parsing coffeescript', async () => {});
});
