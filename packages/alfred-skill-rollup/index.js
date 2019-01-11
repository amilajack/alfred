const rollup = require('rollup');
const replace = require('rollup-plugin-replace');
const { getConfigByConfigName } = require('@alfredpkg/core');

module.exports = {
  name: 'rollup',
  description: 'Build, optimize, and bundle assets in your app',
  interface: '@alfredpkg/interface-build',
  interfaceConfig: {
    supports: {
      flags: {
        // Flag name and argument types
        env: ['production', 'development', 'test'],
        // All the supported targets a `build` skill should build
        targets: ['browser', 'node'],
        // Project type
        types: ['lib']
      }
    },
    // Dispatch all lib builds to rollup
    dispatch: {
      flags: {
        types: {
          app: 'alfred-skill-webpack'
        }
      }
    }
  },
  devDependencies: { rollup: '4.28.3', 'rollup-plugin-replace': '2.1.0' },
  configFiles: [
    {
      name: 'rollup.base',
      path: 'rollup.config.js',
      config: {
        entry:
          process.env.NODE_ENV === 'production'
            ? './src/index.tsx'
            : './src/graph/viz-worker.worker.js',
        output: {
          format: 'es'
        },
        dest: 'targets/lib.js',
        plugins: [
          replace({
            DEBUG: false,
            'process.env.NODE_ENV': JSON.stringify('production')
          })
        ],
        external(id) {
          return id.includes('node_modules');
        }
      }
    }
  ],
  hooks: {
    call(configFiles) {
      const { config } = getConfigByConfigName('rollup.base', configFiles);
      return rollup(config, () => {});
    }
  }
};
