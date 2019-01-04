import path from 'path';
import ParseInput from '../../src/helpers/ParseInput';

const testDir = path.join(__dirname, '..');

// This helps get rid of paths that are not related to the project
// If the project runs on CI, the path to a file will be different
// than on your local environment. This function helps normalize
// file paths by stripping out parent directories from file paths
function stripNonProjectPaths(filePath) {
  return filePath.slice(testDir.length);
}

describe.skip('Helpers', () => {
  const testBasePath = path.join(__dirname, '..', 'test', 'fixtures');

  describe('ParseInput', () => {
    it('should parse directories and files', async () => {
      const files1 = await ParseInput([testBasePath]);
      expect(files1.map(stripNonProjectPaths)).toMatchSnapshot();

      const files2 = await ParseInput([
        testBasePath,
        path.join(__dirname, '..', 'test'),
        path.join(__dirname, '..', 'src', 'alfred.js')
      ]);
      expect(files2.map(stripNonProjectPaths)).toMatchSnapshot();
    });

    it('should fail on non-js files', async () => {
      const files = await ParseInput([
        path.join(testBasePath, 'basic-test.ts')
      ]);
      expect(files.map(stripNonProjectPaths)).toMatchSnapshot();
    });

    it('should filter duplicate files', async () => {
      const files = await ParseInput([
        path.join(testBasePath, 'basic-test.ts'),
        path.join(testBasePath, 'basic-test.ts'),
        path.join(testBasePath, 'class-test.ts'),
        path.join(testBasePath, 'class-test.ts')
      ]);
      expect(files.map(stripNonProjectPaths)).toMatchSnapshot();
    });

    it.skip('should fail on non-existent files', async () => {});
  });

  describe.skip('Validation', () => {});
});
