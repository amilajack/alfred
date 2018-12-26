// @flow
import path from 'path';
import espree from 'espree';
import { expect as chaiExpect } from 'chai';
import Providers, { handleInput } from '../src/providers';

jest.setTimeout(20000);

function parseCodeSnippets(codeSnippets: Array<string> | void) {
  if (codeSnippets) {
    codeSnippets.map(code =>
      espree.parse(code, {
        sourceType: 'module'
      })
    );
  }
}

describe.skip('Migrate', () => {
  const defaultConfig = {
    packageJsonPath: __dirname,
    write: false,
    unsafe: false,
    verbose: false
  };

  it('should migrate basic file', async () => {
    const tmpFile = path.join(__dirname, 'fixtures', 'basic-test.ts');
    const result = await Providers({
      files: [tmpFile],
      ...defaultConfig
    });
    expect(result).toMatchSnapshot();
    parseCodeSnippets(result);
  });

  it('should migrate basic file with EslintProvider', async () => {
    const tmpFile = path.join(__dirname, 'fixtures', 'comma-test.ts');
    const result = await Providers({
      files: [tmpFile],
      ...defaultConfig
    });
    expect(result).toMatchSnapshot();
    parseCodeSnippets(result);
  });

  it('should perform unsafe transformations', async () => {
    const result1 = await Providers({
      ...defaultConfig,
      unsafe: true,
      files: [
        path.join(__dirname, 'fixtures', 'unsafe-transformation-test.ts'),
        path.join(__dirname, 'fixtures', 'class-test.ts')
      ]
    });
    expect(result1).toMatchSnapshot();
    parseCodeSnippets(result1);

    const result2 = await Providers({
      ...defaultConfig,
      unsafe: true,
      files: [
        path.join(__dirname, 'fixtures', 'unsafe-transformation-test.ts'),
        path.join(__dirname, 'fixtures', 'class-test.ts')
      ]
    });
    expect(result2).toMatchSnapshot();
    parseCodeSnippets(result2);
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
      expect({ ...e, path: '' }).toMatchSnapshot();
    }
  });

  it('should run against directories', async () => {
    const result = await Providers({
      ...defaultConfig,
      files: [
        path.join(__dirname, 'fixtures', 'express-hello-world', 'foobar.js'),
        path.join(__dirname, 'fixtures', 'express-hello-world', 'index.js')
      ]
    });
    expect(result).toMatchSnapshot();
    parseCodeSnippets(result);
  });

  it.skip("should not parse .gitignore'd files", async () => {
    const files = await handleInput({
      files: ['.'],
      packageJsonPath: path.join(__dirname, '..', 'package.json'),
      ...defaultConfig
    });

    console.log(files);

    files.forEach(file => {
      chaiExpect(file).to.not.include('node_modules');
    });
  });

  it.skip('should allow selection of manual tests', () => {});

  it.skip('should not write files if one provider fails', async () => {});

  it.skip('should fail on non-js extensions', async () => {});

  it.skip('should fail on parsing coffeescript', async () => {});
});
