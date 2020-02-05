import { getDepsFromPkg, configStringify, escapeStringify } from '../src';

describe('Helpers', () => {
  describe('stringify', () => {
    it('should stringify configs', () => {
      const config = {
        plugins: [
          configStringify`new webpack.plugins()`,
          configStringify`new webpack.plugins()`
        ]
      };
      expect(escapeStringify(config)).toEqual(
        '{"plugins":[new webpack.plugins(),new webpack.plugins()]}'
      );
    });
  });

  describe('getDepsFromPkg', () => {
    it('should add dev deps from pkg deps with default arg', () => {
      expect(
        getDepsFromPkg(['react'], {
          peerDependencies: {},
          dependencies: {},
          devDependencies: { react: '16.0.0' }
        })
      ).toEqual({
        react: '16.0.0'
      });
    });

    it('should add dev deps from pkg deps with dev arg', () => {
      expect(
        getDepsFromPkg(
          ['react'],
          {
            peerDependencies: {},
            dependencies: { react: '16.0.0' },
            devDependencies: {}
          },
          'dep'
        )
      ).toEqual({
        react: '16.0.0'
      });
    });

    it('should not throw on empty pkg names and pkg', () => {
      expect(
        getDepsFromPkg([], {
          peerDependencies: {},
          dependencies: {},
          devDependencies: {}
        })
      ).toEqual({});
    });

    it('should throw on empty pkg', () => {
      expect(() =>
        getDepsFromPkg(['react'], {
          peerDependencies: {},
          dependencies: {},
          devDependencies: {}
        })
      ).toThrow(
        'Package "react" does not exist in devDependencies of skill package.json'
      );
    });

    it('should support single pkg name', () => {
      expect(
        getDepsFromPkg('react', {
          peerDependencies: {},
          dependencies: {},
          devDependencies: { react: '16.0.0' }
        })
      ).toEqual({
        react: '16.0.0'
      });
    });
  });
});
