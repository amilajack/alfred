const webpack = require('webpack');
const path = require('path');
const { getConfigByConfigName } = require('@alfredpkg/core');

module.exports = {
  name: 'webpack',
  description: 'Build, optimize, and bundle assets in your app',
  interface: 'alfred-interface-build',
  dependencies: { webpack: '4.28.3' },
  configFiles: [
    {
      name: 'webpack.base',
      path: 'webpack.base.js',
      config: {
        entry: path.join(process.cwd(), 'src', 'index.js'),
        output: {
          path: path.join(process.cwd(), 'dist'),
          publicPath: './dist/',
          filename: 'index.js'
        },
        mode: 'development',
        module: {
          rules: [
            {
              test: /\.jsx?$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  cacheDirectory: true
                }
              }
            }
          ]
        },
        resolve: {
          extensions: ['.js', '.json']
        },
        plugins: []
      }
    }
  ],
  hooks: {
    call(configFiles) {
      const { config } = getConfigByConfigName('webpack.base', configFiles);
      webpack(config, (err, stats) => {
        if (err) {
          console.error(err.stack || err);
          if (err.details) {
            console.error(err.details);
          }
          return;
        }

        const info = stats.toJson();

        if (stats.hasErrors()) {
          console.error(info.errors.toString());
        }

        if (stats.hasWarnings()) {
          console.warn(info.warnings.toString());
        }
      });
    }
  },
  ctfs: {
    eslint: config =>
      config.extendConfig('eslint', {
        settings: {
          'import/resolver': {
            webpack: {
              config: 'configs/webpack.config.js'
            }
          }
        }
      }),
    jest: config =>
      config.extendConfig('jest', {
        moduleNameMapper: {
          '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/mocks/fileMock.js',
          '\\.(css|less|sass|scss)$': 'identity-obj-proxy'
        }
      })
  }
};
