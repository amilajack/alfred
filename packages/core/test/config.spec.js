import config, { getConfigs, requireConfig } from '../src/config';

describe('config', () => {
  describe('getConfig', () => {
    it('should take an object with ".extends" property', () => {
      expect(
        getConfigs({
          extends: [{ extends: [{ bar: 'zoo' }] }],
          bar: 'bar'
        })
      ).toEqual({
        bar: 'bar'
      });
      expect(
        getConfigs({
          extends: [{ extends: [{ bar: 'zoo' }, { bar: 'foo' }] }],
          bar: 'baz'
        })
      ).toEqual({
        bar: 'baz'
      });

      expect(
        getConfigs({
          extends: [{ extends: '' }]
        })
      ).toEqual({});
    });

    /**
     * @TODO
     */
    it.skip('should not allow recursive deps', () => {});
  });

  describe('config', () => {
    it('should take plain object', () => {
      expect(
        config({
          bar: 'bar'
        })
      ).toEqual({
        bar: 'bar'
      });
    });

    it('should take an object with empty extends', () => {
      expect(
        config({
          extends: [],
          bar: 'bar'
        })
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
        config({
          extends: 'module-1',
          bar: 'who',
          hello: 'jane'
        })
      ).toEqual({
        bar: 'who',
        foo: 'foobar',
        hello: 'jane'
      });
      expect(
        config({
          extends: ['module-2'],
          hello: 'john'
        })
      ).toEqual({
        bar: 'baz',
        cow: 'bar',
        foo: 'foobar',
        hello: 'john'
      });
    });

    it('should throw if extends property is not a string or an array', () => {
      expect(() =>
        config({
          extends: [{ extends: '' }]
        })
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        config({
          extends: () => {}
        })
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
        config({
          extends: ['bliss', 'bliss']
        })
      ).toEqual({
        bar: 'bar',
        foo: 'foobar'
      });
      expect(
        config({
          extends: 'alfred-config-bliss'
        })
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
              '@alfredpkg/skill-lodash',
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
        config({
          extends: 'alfred-config-test'
        })
      ).toEqual({
        bar: 'bar',
        foo: 'foobar',
        skills: [
          [
            '@alfredpkg/skill-lodash',
            {
              collections: true,
              paths: true
            }
          ]
        ]
      });
      expect(
        config({
          extends: 'alfred-config-test',
          skills: [
            '@alfredpkg/skill-parcel',
            [
              '@alfredpkg/skill-babel',
              {
                plugins: ['@babel/preset-flow']
              }
            ],
            [
              '@alfredpkg/skill-babel',
              {
                plugins: ['@babel/preset-react']
              }
            ]
          ]
        })
      ).toEqual({
        bar: 'bar',
        foo: 'foobar',
        skills: [
          [
            '@alfredpkg/skill-lodash',
            {
              collections: true,
              paths: true
            }
          ],
          ['@alfredpkg/skill-parcel', {}],
          [
            '@alfredpkg/skill-babel',
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
