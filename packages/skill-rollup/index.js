/* eslint global-require: off */
const replace = require('@rollup/plugin-replace');
const commonjs = require('@rollup/plugin-commonjs');
const { getConfigByName, mapEnvToShortName } = require('@alfred/helpers');
const { default: mergeConfigs } = require('@alfred/merge-configs');

const interfaceConfig = {
  supports: {
    // Flag name and argument types
    envs: ['production', 'development', 'test'],
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
    ['@alfred/interface-build', interfaceConfig],
    ['@alfred/interface-start', interfaceConfig]
  ],
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
    async run({ configFiles, interfaceState, subcommand }) {
      const [baseConfig, prodConfig, devConfig] = [
        'rollup.base',
        'rollup.prod',
        'rollup.dev'
      ].map(configFile => getConfigByName(configFile, configFiles).config);
      const inputAndOutputConfigs = {
        input: `./src/lib.${interfaceState.target}.js`,
        output: {
          file: `./targets/${mapEnvToShortName(interfaceState.env)}/lib.${
            interfaceState.target
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
          const watchConf = interfaceState.env === 'production' ? prod : dev;
          // @TODO: Mention which port and host the server is running (see webpack skill)
          console.log(
            `Starting ${
              interfaceState.env === 'production' ? 'optimized' : 'unoptimized'
            } build`
          );
          return rollup.watch({
            ...watchConf.input,
            ...watchConf
          });
        }
        case 'build': {
          console.log(
            `Building ${
              interfaceState.env === 'production' ? 'optimized' : 'unoptimized'
            } build`
          );
          const bundle = await rollup.rollup(
            interfaceState.env === 'production' ? prod : dev
          );

          return bundle.write(
            (interfaceState.env === 'production' ? prod : dev).output
          );
        }
        default:
          throw new Error(`Invalid subcommand: "${subcommand}"`);
      }
    }
  },
  transforms: {
    babel(skill, { skillMap }) {
      // eslint-disable-next-line import/no-extraneous-dependencies
      const babel = require('rollup-plugin-babel');
      return skill
        .extendConfig('rollup.base', {
          plugins: [
            babel({
              ...getConfigByName('babel', skillMap.get('babel').configFiles)
                .config,
              exclude: 'node_modules/**'
            })
          ]
        })
        .addDepsFromPkg('rollup-plugin-babel');
    }
  }
};
