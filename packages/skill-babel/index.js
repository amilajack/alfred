/* eslint global-require: off */
const { getConfigByConfigName } = require('@alfred/helpers');

module.exports = {
  name: 'babel',
  description: 'Transpile JS from ESNext to the latest ES version',
  devDependencies: {
    '@babel/cli': '7.2.0',
    '@babel/core': '7.2.0',
    '@babel/preset-env': '7.2.0',
    'babel-core': '^7.0.0-bridge.0',
    'babel-loader': '8.0.5'
  },
  configFiles: [
    {
      name: 'babel',
      path: '.babelrc.js',
      write: true,
      config: {
        presets: [
          '@babel/preset-env'
          // [
          //   '@babel/preset-env',
          //   {
          //     targets: {
          //       esmodules: true
          //     },
          //     modules: false
          //   }
          // ]
        ]
      }
    }
  ],
  hooks: {},
  ctfs: {
    webpack(ctf, ctfs) {
      return ctf
        .extendConfig('webpack.base', {
          module: {
            rules: [
              {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    ...getConfigByConfigName(
                      'babel',
                      ctfs.get('babel').configFiles
                    ).config,
                    cacheDirectory: true
                  }
                }
              }
            ]
          }
        })
        .addDevDependencies({ 'babel-loader': '5.0.0' });
    },
    rollup(ctf, ctfs) {
      // eslint-disable-next-line import/no-extraneous-dependencies
      const babel = require('rollup-plugin-babel');
      return ctf
        .extendConfig('rollup.base', {
          plugins: [
            babel({
              ...getConfigByConfigName('babel', ctfs.get('babel').configFiles)
                .config,
              exclude: 'node_modules/**'
            })
          ]
        })
        .addDevDependencies({
          'rollup-plugin-babel': '4.2.0'
        });
    },
    jest(ctf) {
      return ctf.extendConfig('jest', {
        transform: {
          '^.+\\.jsx?$': './node_modules/jest-transformer.js'
        }
      });
    },
    eslint(ctf) {
      return ctf
        .extendConfig('eslint', {
          parser: 'babel-eslint'
        })
        .addDevDependencies({ 'babel-eslint': '5.0.0' });
    }
  }
};
