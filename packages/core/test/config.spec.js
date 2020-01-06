import { requireConfig } from '@alfred/helpers';
import Config from '../src/config';

describe('config', () => {
  describe('config', () => {
    it('should take plain object', () => {
      expect(
        new Config({
          bar: 'bar'
        }).alfredConfig
      ).toEqual({
        bar: 'bar'
      });
    });

    it('should take an object with empty extends', () => {
      expect(
        new Config({
          extends: []
        }).alfredConfig
      ).toEqual({ extends: [] });
    });

    it('should accept strings in ".extends" array', () => {
      jest.mock(
        'module-1',
        () => ({
          showConfigs: true
        }),
        { virtual: true }
      );
      jest.mock(
        'module-2',
        () => ({
          showConfigs: false
        }),
        { virtual: true }
      );
      expect(
        new Config({
          extends: 'module-1'
        }).alfredConfig
      ).toEqual({
        showConfigs: true
      });
      expect(
        new Config({
          extends: ['module-2'],
          showConfigs: true
        }).alfredConfig
      ).toEqual({
        showConfigs: true
      });
    });

    it('should throw if extends property is not a string or an array', () => {
      expect(
        () =>
          new Config({
            extends: () => {}
          })
      ).toThrowErrorMatchingSnapshot();
    });

    it('should not accept objects as input', () => {
      expect(
        () =>
          new Config({
            extends: [{ extends: {} }]
          })
      ).toThrow();
    });

    it('should require non-prefied modules', () => {
      jest.mock(
        'alfred-config-bliss',
        () => ({
          bar: 'bar',
          foo: 'foobar'
        }),
        { virtual: true }
      );
      expect(
        new Config({
          extends: ['bliss', 'bliss']
        }).alfredConfig
      ).toEqual({
        bar: 'bar',
        foo: 'foobar'
      });
      expect(
        new Config({
          extends: 'alfred-config-bliss'
        }).alfredConfig
      ).toEqual({
        bar: 'bar',
        foo: 'foobar'
      });
    });

    it('should accept options that can be overriden', () => {
      jest.mock(
        'alfred-config-test',
        () => ({
          bar: 'bar',
          foo: 'foobar',
          skills: [
            [
              '@alfred/skill-lodash',
              {
                collections: true,
                paths: true
              }
            ]
          ]
        }),
        { virtual: true }
      );
      expect(
        new Config({
          extends: 'alfred-config-test'
        }).alfredConfig
      ).toEqual({
        bar: 'bar',
        foo: 'foobar',
        skills: [
          [
            '@alfred/skill-lodash',
            {
              collections: true,
              paths: true
            }
          ]
        ]
      });
      expect(
        new Config({
          extends: 'alfred-config-test',
          skills: [
            '@alfred/skill-parcel',
            [
              '@alfred/skill-babel',
              {
                plugins: ['@babel/preset-flow']
              }
            ],
            [
              '@alfred/skill-babel',
              {
                plugins: ['@babel/preset-react']
              }
            ]
          ]
        }).alfredConfig
      ).toEqual({
        bar: 'bar',
        foo: 'foobar',
        skills: [
          [
            '@alfred/skill-lodash',
            {
              collections: true,
              paths: true
            }
          ],
          ['@alfred/skill-parcel', {}],
          [
            '@alfred/skill-babel',
            {
              plugins: ['@babel/preset-flow', '@babel/preset-react']
            }
          ]
        ]
      });
    });

    it('should throw if require non-existent module', () => {
      expect(() => requireConfig('foo')).toThrowErrorMatchingSnapshot();
    });
  });
});
