const { getConfigPathByConfigName } = require('@alfredpkg/core');

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
        output: {
          path: '/',
          // https://github.com/webpack/webpack/issues/1114
          libraryTarget: 'commonjs2'
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
      const configPath = getConfigPathByConfigName('webpack.base', configFiles);
      return `./node_modules/.bin/webpack --config ${configPath}`;
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
