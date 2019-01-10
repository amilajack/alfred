const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const path = require('path');
const { getConfigByConfigName } = require('@alfredpkg/core');

module.exports = {
  name: 'webpack',
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
        types: ['app']
      }
    }
  },
  devDependencies: { webpack: '4.28.3', 'webpack-cli': '3.2.1' },
  configFiles: [
    {
      name: 'webpack.base',
      path: 'webpack.base.js',
      config: {
        entry: path.join(process.cwd(), 'src', 'main.js'),
        output: {
          path: path.join(process.cwd(), 'targets'),
          publicPath: './targets/',
          filename: 'main.js'
        },
        mode: 'development',
        resolve: {
          extensions: ['.js', '.json']
        },
        plugins: []
      }
    },
    {
      name: 'webpack.prod',
      path: 'webpack.prod.js',
      config: {
        entry: path.join(process.cwd(), 'src', 'main.js'),
        output: {
          path: path.join(process.cwd(), 'targets'),
          publicPath: './targets/',
          filename: 'main.js'
        },
        mode: 'production',
        resolve: {
          extensions: ['.js', '.json']
        },
        plugins: []
      }
    },
    {
      name: 'webpack.dev',
      path: 'webpack.dev.js',
      config: {
        entry: path.join(process.cwd(), 'src', 'main.js'),
        output: {
          path: path.join(process.cwd(), 'targets'),
          publicPath: './targets/',
          filename: 'main.js'
        },
        mode: 'development',
        resolve: {
          extensions: ['.js', '.json']
        },
        plugins: []
      }
    }
  ],
  hooks: {
    call(configFiles) {
      const { baseConfig } = getConfigByConfigName('webpack.base', configFiles);
      const { config: prodConfig } = getConfigByConfigName(
        'webpack.prod',
        configFiles
      );
      // const { config: devConfig } = getConfigByConfigName(
      //   'webpack.dev',
      //   configFiles
      // );
      const mergedProdConfig = webpackMerge(baseConfig, prodConfig);
      // const mergedDevConfig = webpackMerge(baseConfig, prodConfig);
      webpack(mergedProdConfig, (err, stats) => {
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
              config: path.join(process.cwd(), '.configs', 'webpack.config.js')
            }
          }
        }
      }),
    jest: config =>
      config
        .extendConfig('jest', {
          moduleNameMapper: {
            '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
              '<rootDir>/.configs/mocks/fileMock.js',
            '\\.(css|less|sass|scss)$': 'identity-obj-proxy'
          }
        })
        .addDevDependencies({
          'identity-obj-proxy': '*'
        })
  }
};
