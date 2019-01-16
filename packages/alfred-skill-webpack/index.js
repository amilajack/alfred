const webpack = require('webpack');
const path = require('path');
const { getConfigByConfigName } = require('@alfredpkg/core');
const { default: mergeConfigs } = require('@alfredpkg/merge-configs');
const { getProjectRoot } = require('@alfredpkg/cli');

// @HACK project root should be passed as argument to configFiles, which could be a function
const projectRoot = getProjectRoot();

const interfaceConfig = {
  supports: {
    // Flag name and argument types
    env: ['production', 'development', 'test'],
    // All the supported targets a `build` skill should build
    targets: ['browser', 'node'],
    // Project type
    projectTypes: ['app']
  }
};

module.exports = {
  name: 'webpack',
  description: 'Build, optimize, and bundle assets in your app',
  interfaces: {
    '@alfredpkg/interface-build': interfaceConfig,
    '@alfredpkg/interface-start': interfaceConfig
  },
  devDependencies: { webpack: '4.28.3', 'webpack-cli': '3.2.1' },
  configFiles: [
    {
      name: 'webpack.base',
      path: 'webpack.base.js',
      config: {
        mode: 'development',
        output: {
          path: path.join(projectRoot, 'targets', 'dev'),
          publicPath: './targets/dev'
        },
        resolve: {
          extensions: ['.mjs', '.js', '.json']
        },
        plugins: []
      }
    },
    {
      name: 'webpack.prod',
      path: 'webpack.prod.js',
      config: {
        output: {
          path: path.join(projectRoot, 'targets', 'prod'),
          publicPath: './targets/prod'
        },
        // @TODO: optimizations, etc
        mode: 'production'
      }
    },
    {
      name: 'webpack.dev',
      path: 'webpack.dev.js',
      config: {
        // @TODO: wepack-dev-server, HMR, sass, css, etc
        mode: 'development'
      }
    },
    {
      name: 'webpack.node',
      path: 'webpack.node.js',
      config: {
        entry: path.join(projectRoot, 'src', 'app.node.js'),
        output: {
          filename: 'app.node.js'
        },
        target: 'node'
      }
    },
    {
      name: 'webpack.browser',
      path: 'webpack.browser.js',
      config: {
        entry: path.join(projectRoot, 'src', 'app.browser.js'),
        output: {
          filename: 'app.browser.js'
        },
        target: 'web'
      }
    }
  ],
  hooks: {
    call(configFiles, ctf, alfredConfig, state) {
      const { config: baseConfig } = getConfigByConfigName(
        'webpack.base',
        configFiles
      );
      const { config: prodConfig } = getConfigByConfigName(
        'webpack.prod',
        configFiles
      );
      const { config: devConfig } = getConfigByConfigName(
        'webpack.dev',
        configFiles
      );
      const { config: nodeConfig } = getConfigByConfigName(
        'webpack.node',
        configFiles
      );
      const { config: browserConfig } = getConfigByConfigName(
        'webpack.browser',
        configFiles
      );
      const mergedConfig = mergeConfigs(
        baseConfig,
        state.env === 'production' ? prodConfig : devConfig,
        state.target === 'browser' ? browserConfig : nodeConfig
      );
      return webpack(mergedConfig, (err, stats) => {
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
    eslint: (config, ctfs, { alfredConfig }) =>
      config.extendConfig('eslint', {
        settings: {
          'import/resolver': {
            webpack: {
              config: path.join(
                alfredConfig.root,
                '.configs',
                'webpack.config.js'
              )
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
