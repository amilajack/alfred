/* eslint global-require: off */
const replace = require('@rollup/plugin-replace');
const commonjs = require('@rollup/plugin-commonjs');
const { mapEnvToShortName } = require('@alfred/helpers');
const { default: mergeConfigs } = require('@alfred/merge-configs');

const interfaceConfig = {
  supports: {
    // Flag name and argument types
    envs: ['production', 'development', 'test'],
    // All the supported targets a `build` skill should build
    targets: ['browser', 'node'],
    // Project type
    projects: ['lib']
  }
};

module.exports = {
  name: 'rollup',
  description: 'Build, optimize, and bundle assets in your app',
  interfaces: [
    ['@alfred/interface-build', interfaceConfig],
    ['@alfred/interface-start', interfaceConfig]
  ],
  configs: [
    {
      alias: 'rollup.base',
      filename: 'rollup.base.js',
      config: {
        external(id) {
          return id.includes('node_modules');
        }
      }
    },
    {
      alias: 'rollup.prod',
      filename: 'rollup.prod.js',
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
      alias: 'rollup.dev',
      filename: 'rollup.dev.js',
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
    async run({ skill, data }) {
      const { target, subcommand } = data;
      const [baseConfig, prodConfig, devConfig] = [
        'rollup.base',
        'rollup.prod',
        'rollup.dev'
      ].map(configFile => skill.configs.get(configFile).config);
      const inputAndOutputConfigs = {
        input: `./src/lib.${target.platform}.js`,
        output: {
          file: `./targets/${mapEnvToShortName(target.env)}/lib.${
            target.platform
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
          const watchConf = target.env === 'production' ? prod : dev;
          // @TODO: Mention which port and host the server is running (see webpack skill)
          console.log(
            `Starting ${
              target.env === 'production' ? 'optimized' : 'unoptimized'
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
              target.env === 'production' ? 'optimized' : 'unoptimized'
            } build`
          );
          const bundle = await rollup.rollup(
            target.env === 'production' ? prod : dev
          );

          return bundle.write(
            (target.env === 'production' ? prod : dev).output
          );
        }
        default:
          throw new Error(`Invalid subcommand: "${subcommand}"`);
      }
    }
  },
  transforms: {
    babel(skill, { toSkill }) {
      // eslint-disable-next-line import/no-extraneous-dependencies
      const babel = require('rollup-plugin-babel');
      return skill
        .extendConfig('rollup.base', {
          plugins: [
            babel({
              ...toSkill.configs.get('babel').config,
              exclude: 'node_modules/**'
            })
          ]
        })
        .addDepsFromPkg('rollup-plugin-babel');
    }
  }
};
