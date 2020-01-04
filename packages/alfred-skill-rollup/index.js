const replace = require('rollup-plugin-replace');
const commonjs = require('rollup-plugin-commonjs');
const { mapEnvToShortName } = require('@alfred/core');
const { getConfigByConfigName } = require('@alfred/helpers');
const { default: mergeConfigs } = require('@alfred/merge-configs');

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
    ['@alfred/interface-build', interfaceConfig],
    ['@alfred/interface-start', interfaceConfig]
  ],
  devDependencies: { rollup: '4.28.3', 'rollup-plugin-replace': '2.1.0' },
  configFiles: [
    {
      name: 'rollup.base',
      path: 'rollup.base.js',
      applySkillConfig: true,
      write: true,
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
    async call({ configFiles, interfaceState, subcommand }) {
      // if (alfredConfig.showConfigs) {
      //   const configPath = getConfigPathByConfigName(
      //     'rollup.base',
      //     configFiles
      //   );
      //   const binPath = await getPkgBinPath('rollup', 'rollup');
      //   const filename = [interfaceState.projectType, interfaceState.target, 'js'].join('.');
      //   const watchFlag = subcommand === 'start' ? '--watch' : '';
      //   const cmd =
      //     interfaceState.env === 'production'
      //       ? `./src/${filename} ${watchFlag} --format esm --file ./targets/prod/${filename}`
      //       : `./src/${filename} ${watchFlag} --format cjs --file ./targets/dev/${filename}`;
      //   return execCommand(
      //     [
      //       binPath,
      //       cmd,
      //       alfredConfig.showConfigs ? `--config ${configPath} .` : ''
      //     ].join(' ')
      //   );
      // }

      const [baseConfig, prodConfig, devConfig] = [
        'rollup.base',
        'rollup.prod',
        'rollup.dev'
      ].map(e => getConfigByConfigName(e, configFiles).config);
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
  }
};
