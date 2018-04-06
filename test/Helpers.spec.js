// @flow
import path from 'path';
import ParseInput from '../src/helpers/ParseInput';

describe('Helpers', () => {
  const testBasePath = path.join(__dirname, '..', 'test', 'fixtures');

  describe('ParseInput', () => {
    it('should parse directories and files', async () => {
      expect(await ParseInput([testBasePath])).toMatchSnapshot();
      expect(
        await ParseInput([
          testBasePath,
          path.join(__dirname, '..', 'test'),
          path.join(__dirname, '..', 'src', 'alfred.js')
        ])
      ).toMatchSnapshot();
    });

    it('should fail on non-js files', async () => {
      const files = await ParseInput([
        path.join(testBasePath, 'basic-test.ts')
      ]);
      expect(files).toMatchSnapshot();
    });

    it('should filter duplicate files', async () => {
      const files = await ParseInput([
        path.join(testBasePath, 'basic-test.ts'),
        path.join(testBasePath, 'basic-test.ts'),
        path.join(testBasePath, 'class-test.ts'),
        path.join(testBasePath, 'class-test.ts')
      ]);
      expect(files).toMatchSnapshot();
    });

    it.skip('should fail on non-existent files', async () => {});
  });

  describe.skip('Validation', () => {});
});
