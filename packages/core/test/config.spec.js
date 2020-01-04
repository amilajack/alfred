import { requireConfig } from '@alfred/helpers';
import Config from '../src/config';

describe('config', () => {
  describe('getConfig', () => {
    it('should take an object with ".extends" property', () => {
      expect(
        new Config({
          extends: [{ extends: [{ bar: 'zoo' }] }],
          bar: 'bar'
        }).normalizeWithResolvedConfigs()
      ).toEqual({
        bar: 'bar'
      });
      expect(
        new Config({
          extends: [{ extends: [{ bar: 'zoo' }, { bar: 'foo' }] }],
          bar: 'baz'
        }).normalizeWithResolvedConfigs()
      ).toEqual({
        bar: 'baz'
      });

      expect(
        new Config({
          extends: [{ extends: '' }]
        })
      ).toEqual({}.normalizeWithResolvedConfigs());
    });

    /**
     * @TODO
     */
    it.skip('should not allow recursive deps', () => {});
  });

  describe('config', () => {
    it('should take plain object', () => {
      expect(
        new Config({
          bar: 'bar'
        }).normalizeWithResolvedSkills()
      ).toEqual({
        bar: 'bar'
      });
    });

    it('should take an object with empty extends', () => {
      expect(
        new Config({
          extends: [],
          bar: 'bar'
        }).normalizeWithResolvedSkills()
      ).toEqual({
        bar: 'bar'
      });
    });

    it('should accept strings in ".extends" array', () => {
      jest.mock(
        'module-1',
        () => ({
          bar: 'bar',
          foo: 'foobar'
        }),
        { virtual: true }
      );
      jest.mock(
        'module-2',
        () => ({
          bar: 'baz',
          cow: 'bar',
          extends: 'module-1'
        }),
        { virtual: true }
      );
      expect(
        new Config({
          extends: 'module-1',
          bar: 'who',
          hello: 'jane'
        }).normalizeWithResolvedSkills()
      ).toEqual({
        bar: 'who',
        foo: 'foobar',
        hello: 'jane'
      });
      expect(
        new Config({
          extends: ['module-2'],
          hello: 'john'
        }).normalizeWithResolvedSkills()
      ).toEqual({
        bar: 'baz',
        cow: 'bar',
        foo: 'foobar',
        hello: 'john'
      });
    });

    it('should throw if extends property is not a string or an array', () => {
      expect(() =>
        new Config({
          extends: [{ extends: '' }]
        }).normalizeWithResolvedSkills()
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        new Config({
          extends: () => {}
        }).normalizeWithResolvedSkills()
      ).toThrowErrorMatchingSnapshot();
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
        }).normalizeWithResolvedSkills()
      ).toEqual({
        bar: 'bar',
        foo: 'foobar'
      });
      expect(
        new Config({
          extends: 'alfred-config-bliss'
        }).normalizeWithResolvedSkills()
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
        }).normalizeWithResolvedSkills()
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
        }).normalizeWithResolvedSkills()
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
