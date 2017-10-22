// @flow
import path from 'path';
import Providers from '../src/providers';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

describe('Migrate', () => {
  const defaultConfig = {
    packageJsonPath: __dirname,
    write: false
  };

  it('should migrate basic file', async () => {
    const tmpFile = path.join(__dirname, 'fixtures', 'basic-test.ts');
    const result = await Providers({
      files: [tmpFile],
      ...defaultConfig
    });
    expect(result).toMatchSnapshot();
  });

  it('should migrate basic file with EslintProvider', async () => {
    const tmpFile = path.join(__dirname, 'fixtures', 'comma-test.ts');
    const result = await Providers({
      files: [tmpFile],
      ...defaultConfig
    });
    expect(result).toMatchSnapshot();
  });

  it('should perform unsafe transformations', async () => {
    expect(await Providers({
      ...defaultConfig,
      files: [
        path.join(__dirname, 'fixtures', 'unsafe-transformation-test.ts'),
        path.join(__dirname, 'fixtures', 'class-test.ts')
      ],
      unsafe: true
    })).toMatchSnapshot();

    expect(await Providers({
      ...defaultConfig,
      files: [
        path.join(__dirname, 'fixtures', 'unsafe-transformation-test.ts'),
        path.join(__dirname, 'fixtures', 'class-test.ts')
      ]
    })).toMatchSnapshot();
  });

  it('should fail on non-existent files', async () => {
    try {
      await Providers({
        ...defaultConfig,
        files: [
          path.join(__dirname, 'fixtures', 'foo-test.ts'),
          path.join(__dirname, 'fixtures', 'class-test.ts')
        ]
      });
    } catch (e) {
      expect(e).toMatchSnapshot();
    }
  });

  it.skip('should allow selection of manual tests', () => {});

  it.skip('should not write files if one provider fails', async () => {});

  it.skip('should fail on non-js extensions', async () => {});

  it.skip('should fail on parsing coffeescript', async () => {});
});
