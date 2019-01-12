const replace = require('rollup-plugin-replace');
const {
  getConfigPathByConfigName,
  getPkgBinPath,
  execCommand,
  getConfigByConfigName,
  mapEnvToShortName
} = require('@alfredpkg/core');
const { default: mergeConfigs } = require('@alfredpkg/merge-configs');

module.exports = {
  name: 'rollup',
  description: 'Build, optimize, and bundle assets in your app',
  interface: '@alfredpkg/interface-build',
  interfaceConfig: {
    supports: {
      // Flag name and argument types
      env: ['production', 'development', 'test'],
      // All the supported targets a `build` skill should build
      targets: ['browser', 'node'],
      // Project type
      projectTypes: ['lib']
    }
  },
  devDependencies: { rollup: '4.28.3', 'rollup-plugin-replace': '2.1.0' },
  configFiles: [
    {
      name: 'rollup.base',
      path: 'rollup.base.js',
      config: {
        output: {
          format: 'es'
        },
        external(id) {
          return id.includes('node_modules');
        }
      }
    },
    {
      name: 'rollup.prod',
      path: 'rollup.prod.js',
      config: {
        plugins: [
          replace({
            DEBUG: false,
            'process.env.NODE_ENV': JSON.stringify('production')
          })
        ]
      }
    },
    {
      name: 'rollup.dev',
      path: 'rollup.dev.js',
      config: {
        plugins: [
          replace({
            DEBUG: true,
            'process.env.NODE_ENV': JSON.stringify('development')
          })
        ]
      }
    }
  ],
  hooks: {
    async call(configFiles, ctf, alfredConfig, state) {
      const configPath = getConfigPathByConfigName('rollup.base', configFiles);
      const binPath = await getPkgBinPath('rollup', 'rollup');
      const filename = [state.projectType, state.target, 'js'].join('.');
      const cmd =
        state.env === 'production'
          ? `./src/${filename} --format esm --file ./targets/prod/${filename}`
          : `./src/${filename} --format umd --name "myBundle" --file ./targets/dev/${filename}`;
      if (alfredConfig.showConfigs) {
        return execCommand(
          [
            binPath,
            cmd,
            alfredConfig.showConfigs ? `--config ${configPath} .` : ''
          ].join(' ')
        );
      }

      const [baseConfig, prodConfig, devConfig] = [
        'rollup.base',
        'rollup.prod',
        'rollup.dev'
      ].map(e => getConfigByConfigName(e, configFiles).config);
      const inputAndOutputConfigs = {
        input: `./src/lib.${state.target}.js`,
        output: {
          file: `./targets/${mapEnvToShortName(state.env)}/${state.target}.js`
        }
      };
      const prod = mergeConfigs(
        {},
        baseConfig,
        prodConfig,
        inputAndOutputConfigs
      );
      const dev = mergeConfigs(
        {},
        baseConfig,
        devConfig,
        inputAndOutputConfigs
      );
      const rollup = require('rollup');
      const bundle = await rollup.rollup(
        state.env === 'production' ? prod : dev
      );

      return bundle.write((state.env === 'production' ? prod : dev).output);
    }
  }
};
