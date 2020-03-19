import { requireConfig } from '@alfred/helpers';
import Config from '../src/config';

describe('config', () => {
  describe('config', () => {
    it('should take plain object', () => {
      expect(
        new Config({
          autoInstall: false
        }).getConfigValues()
      ).toEqual({
        ...Config.DEFAULT_CONFIG,
        autoInstall: false
      });
    });

    it('should take an object with empty extends', () => {
      expect(
        new Config({
          extends: []
        }).getConfigValues()
      ).toEqual({ ...Config.DEFAULT_CONFIG });
    });

    it('should accept strings in ".extends" array', () => {
      jest.mock(
        'module-1',
        () => ({
          configsDir: '.configs-dir-test-1'
        }),
        { virtual: true }
      );
      jest.mock(
        'module-2',
        () => ({
          configsDir: '.configs-dir-test-2'
        }),
        { virtual: true }
      );
      expect(
        new Config({
          extends: 'module-1'
        }).getConfigValues()
      ).toEqual({
        ...Config.DEFAULT_CONFIG,
        configsDir: '.configs-dir-test-1'
      });
      expect(
        new Config({
          extends: ['module-2'],
          configsDir: '.configs-dir-test-3'
        }).getConfigValues()
      ).toEqual({
        ...Config.DEFAULT_CONFIG,
        configsDir: '.configs-dir-test-3'
      });
    });

    it('should throw if extends property is not a string or an array', () => {
      expect(
        () =>
          new Config({
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            extends: (): void => {}
          })
      ).toThrowErrorMatchingSnapshot();
    });

    it('should not accept objects as input', () => {
      expect(
        () =>
          new Config({
            // @ts-ignore
            extends: [{ extends: {} }]
          })
      ).toThrow();
    });

    it('should require non-prefixed modules', () => {
      jest.mock(
        'alfred-config-bliss',
        () => ({
          autoInstall: true,
          skills: ['@alfred/skill-react']
        }),
        { virtual: true }
      );
      expect(
        new Config({
          extends: ['bliss']
        }).getConfigValues()
      ).toEqual({
        ...Config.DEFAULT_CONFIG,
        autoInstall: true,
        skills: [['@alfred/skill-react', {}]]
      });
      expect(
        new Config({
          extends: 'alfred-config-bliss'
        }).getConfigValues()
      ).toEqual({
        ...Config.DEFAULT_CONFIG,
        autoInstall: true,
        skills: [['@alfred/skill-react', {}]]
      });
    });

    it('should require namespaced modules', () => {
      jest.mock(
        '@jane-doe/alfred-config-bliss',
        () => ({
          autoInstall: true,
          skills: ['@alfred/skill-react']
        }),
        { virtual: true }
      );
      expect(
        new Config({
          extends: ['@jane-doe/alfred-config-bliss']
        }).getConfigValues()
      ).toEqual({
        ...Config.DEFAULT_CONFIG,
        autoInstall: true,
        skills: [['@alfred/skill-react', {}]]
      });
    });

    it('should accept options that can be overriden', () => {
      jest.mock(
        'alfred-config-test',
        () => ({
          configsDir: '.configs-dir-test',
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
        }).getConfigValues()
      ).toEqual({
        ...Config.DEFAULT_CONFIG,
        configsDir: '.configs-dir-test',
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
        }).getConfigValues()
      ).toEqual({
        ...Config.DEFAULT_CONFIG,
        configsDir: '.configs-dir-test',
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
