const webpack = require('webpack');
const path = require('path');
const { getConfigByConfigName } = require('@alfredpkg/core');
const { default: mergeConfigs } = require('@alfredpkg/merge-configs');
const { getProjectRoot } = require('@alfredpkg/cli');
const getPort = require('get-port');

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
  interfaces: [
    ['@alfredpkg/interface-build', interfaceConfig],
    ['@alfredpkg/interface-start', interfaceConfig]
  ],
  devDependencies: {
    webpack: '4.28.3',
    'webpack-cli': '3.2.1',
    'webpack-dev-server': '3.1.14'
  },
  configFiles: [
    {
      name: 'webpack.base',
      path: 'webpack.base.js',
      write: true,
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
        mode: 'development',
        entry: [
          // @TODO
          // 'react-hot-loader/patch',
          'webpack-dev-server/client?http://localhost:8080/',
          'webpack/hot/only-dev-server'
        ],
        output: {
          path: path.join(projectRoot, 'targets', 'dev'),
          publicPath: 'http://localhost:8080/'
        },
        devServer: {
          open: true,
          port: 8080,
          publicPath: 'http://localhost:8080',
          compress: true,
          noInfo: true,
          stats: 'errors-only',
          inline: true,
          lazy: false,
          hot: true,
          headers: { 'Access-Control-Allow-Origin': '*' },
          contentBase: path.join(projectRoot, 'src'),
          watchOptions: {
            aggregateTimeout: 300,
            ignored: /node_modules/,
            poll: 100
          },
          historyApiFallback: {
            verbose: true,
            disableDotRule: false
          }
        },
        plugins: [
          new webpack.HotModuleReplacementPlugin({
            multiStep: true
          })
        ]
      }
    },
    {
      name: 'webpack.node',
      path: 'webpack.node.js',
      config: {
        entry: [path.join(projectRoot, 'src', 'app.node.js')],
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
        entry: [path.join(projectRoot, 'src', 'app.browser.js')],
        output: {
          filename: 'app.browser.js'
        },
        target: 'web'
      }
    }
  ],
  hooks: {
    async call(configFiles, ctf, alfredConfig, state, subcommand) {
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

      switch (subcommand) {
        case 'start': {
          const Webpack = require('webpack');
          const WebpackDevServer = require('webpack-dev-server');
          const compiler = Webpack(mergedConfig);
          const { devServer } = mergedConfig;
          const server = new WebpackDevServer(compiler, devServer);
          const port = await getPort({ port: 8080 });
          return server.listen(port, '127.0.0.1', () => {
            console.log(
              `Starting ${
                state.env !== 'production' ? 'unoptimized' : 'optimized'
              } build on http://localhost:${port}...`
            );
          });
        }
        case 'build': {
          console.log(
            `Building ${
              state.env !== 'production' ? 'unoptimized' : 'optimized'
            } build...`
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
        default:
          throw new Error(`Invalid subcommand: "${subcommand}"`);
      }
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
