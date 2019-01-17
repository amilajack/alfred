const replace = require('rollup-plugin-replace');
const commonjs = require('rollup-plugin-commonjs');
const {
  getConfigPathByConfigName,
  getPkgBinPath,
  execCommand,
  getConfigByConfigName,
  mapEnvToShortName
} = require('@alfredpkg/core');
const { default: mergeConfigs } = require('@alfredpkg/merge-configs');

const interfaceConfig = {
  supports: {
    // Flag name and argument types
    env: ['production', 'development', 'test'],
    // All the supported targets a `build` skill should build
    targets: ['browser', 'node'],
    // Project type
    projectTypes: ['lib']
  }
};

module.exports = {
  name: 'rollup',
  description: 'Build, optimize, and bundle assets in your app',
  interfaces: [
    ['@alfredpkg/interface-build', interfaceConfig],
    ['@alfredpkg/interface-start', interfaceConfig]
  ],
  devDependencies: { rollup: '4.28.3', 'rollup-plugin-replace': '2.1.0' },
  configFiles: [
    {
      name: 'rollup.base',
      path: 'rollup.base.js',
      config: {
        external(id) {
          return id.includes('node_modules');
        }
      }
    },
    {
      name: 'rollup.prod',
      path: 'rollup.prod.js',
      config: {
        output: {
          format: 'es'
        },
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
        output: {
          format: 'cjs'
        },
        plugins: [
          replace({
            DEBUG: true,
            'process.env.NODE_ENV': JSON.stringify('development')
          }),
          commonjs()
        ]
      }
    }
  ],
  hooks: {
    async call(configFiles, ctf, alfredConfig, state, subcommand) {
      if (alfredConfig.showConfigs) {
        const configPath = getConfigPathByConfigName(
          'rollup.base',
          configFiles
        );
        const binPath = await getPkgBinPath('rollup', 'rollup');
        const filename = [state.projectType, state.target, 'js'].join('.');
        const watchFlag = subcommand === 'start' ? '--watch' : '';
        const cmd =
          state.env === 'production'
            ? `./src/${filename} ${watchFlag} --format esm --file ./targets/prod/${filename}`
            : `./src/${filename} ${watchFlag} --format cjs --file ./targets/dev/${filename}`;
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
          file: `./targets/${mapEnvToShortName(state.env)}/lib.${
            state.target
          }.js`
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

      switch (subcommand) {
        case 'start': {
          const watchConf = state.env === 'production' ? prod : dev;
          // @TODO: Mention which port and host the server is running (see webpack skill)
          console.log(
            `Starting ${
              state.env !== 'production' ? 'unoptimized' : 'optimized'
            } build...`
          );
          return rollup.watch({
            ...watchConf.input,
            ...watchConf
          });
        }
        case 'build': {
          console.log(
            `Building ${
              state.env !== 'production' ? 'unoptimized' : 'optimized'
            } build...`
          );
          const bundle = await rollup.rollup(
            state.env === 'production' ? prod : dev
          );

          return bundle.write((state.env === 'production' ? prod : dev).output);
        }
        default:
          throw new Error(`Invalid subcommand: "${subcommand}"`);
      }
    }
  }
};
