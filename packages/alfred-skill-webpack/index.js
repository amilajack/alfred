const webpack = require('webpack');
const path = require('path');
const { getConfigByConfigName } = require('@alfred/helpers');
const { default: mergeConfigs } = require('@alfred/merge-configs');
const { searchProjectRoot } = require('@alfred/core');
const getPort = require('get-port');

function replaceProjectRoot(pathConfig, projectRoot) {
  return pathConfig.replace('<projectRoot>', projectRoot);
}

const interfaceConfig = {
  supports: {
    // Flag name and argument types
    env: ['production', 'development', 'test'],
    // All the supported targets a `build` skill should build
    // @TODO: Add node to targets
    targets: ['browser'],
    // Project type
    projectTypes: ['app']
  }
};

const shouldOpenInBrowser =
  !('ALFRED_E2E_TEST' in process.env) || process.env.ALFRED_E2E_TEST !== 'true';

module.exports = {
  name: 'webpack',
  description: 'Build, optimize, and bundle assets in your app',
  interfaces: [
    ['@alfred/interface-build', interfaceConfig],
    ['@alfred/interface-start', interfaceConfig]
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
      configType: 'module',
      config: {
        mode: 'development',
        output: {
          path: path.join('<projectRoot>', 'targets', 'dev'),
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
      configType: 'module',
      config: {
        output: {
          path: path.join('<projectRoot>', 'targets', 'prod'),
          publicPath: './targets/prod'
        },
        // @TODO: optimizations, etc
        mode: 'production'
      }
    },
    {
      name: 'webpack.dev',
      path: 'webpack.dev.js',
      configType: 'module',
      config: {
        // @TODO: wepack-dev-server, HMR, sass, css, etc
        mode: 'development',
        entry: [
          // @TODO
          'react-hot-loader/patch',
          'webpack-dev-server/client?http://localhost:1234/',
          'webpack/hot/only-dev-server'
        ],
        output: {
          path: path.join('<projectRoot>', 'targets', 'dev'),
          publicPath: 'http://localhost:1234/'
        },
        devServer: {
          open: shouldOpenInBrowser,
          port: 1234,
          publicPath: '/',
          compress: true,
          noInfo: true,
          stats: 'errors-only',
          inline: true,
          lazy: false,
          hot: true,
          headers: { 'Access-Control-Allow-Origin': '*' },
          contentBase: path.join('<projectRoot>', 'src'),
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
      configType: 'module',
      config: {
        entry: [path.join('<projectRoot>', 'src', 'app.node.js')],
        output: {
          filename: 'app.node.js'
        },
        target: 'node'
      }
    },
    {
      name: 'webpack.browser',
      path: 'webpack.browser.js',
      configType: 'module',
      config: {
        entry: [path.join('<projectRoot>', 'src', 'app.browser.js')],
        output: {
          filename: 'app.browser.js'
        },
        target: 'web'
      }
    }
  ],
  hooks: {
    async call({ configFiles, interfaceState, subcommand }) {
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
        interfaceState.env === 'production' ? prodConfig : devConfig,
        interfaceState.target === 'browser' ? browserConfig : nodeConfig
      );

      const projectRoot = searchProjectRoot();

      // @HACK: The following lines should be replaced with an algorithm that
      //        recursively traverses and object and replaces each project root
      if (mergedConfig.output && mergedConfig.output.path) {
        mergedConfig.output.path = replaceProjectRoot(
          mergedConfig.output.path,
          projectRoot
        );
      }
      if (mergedConfig.devServer && mergedConfig.devServer.contentBase) {
        mergedConfig.devServer.contentBase = replaceProjectRoot(
          mergedConfig.devServer.contentBase,
          projectRoot
        );
      }
      if (mergedConfig.entry) {
        if (Array.isArray(mergedConfig.entry)) {
          mergedConfig.entry = mergedConfig.entry.map(e =>
            replaceProjectRoot(e, projectRoot)
          );
        } else {
          mergedConfig.entry = replaceProjectRoot(
            mergedConfig.entry,
            projectRoot
          );
        }
      }

      switch (subcommand) {
        case 'start': {
          const Webpack = require('webpack');
          const WebpackDevServer = require('webpack-dev-server');
          WebpackDevServer.addDevServerEntrypoints(mergedConfig, {
            contentBase: path.join(projectRoot, 'src'),
            hot: true,
            host: 'localhost'
          });
          const compiler = Webpack(mergedConfig);
          const { devServer } = mergedConfig;
          const server = new WebpackDevServer(compiler, devServer);
          const port = await getPort({ port: 1234 });
          return server.listen(port, 'localhost', async () => {
            const url = `http://localhost:${port}`;
            console.log(
              `Starting ${
                interfaceState.env === 'production'
                  ? 'optimized'
                  : 'unoptimized'
              } build on ${url}`
            );
          });
        }
        case 'build': {
          console.log(
            `Building ${
              interfaceState.env === 'production' ? 'optimized' : 'unoptimized'
            } build`
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
    eslint: (_config, ctfs, { config }) =>
      _config
        .extendConfig('eslint', {
          settings: {
            'import/resolver': {
              webpack: {
                config: path.join(config.root, '.configs', 'webpack.browser.js')
              }
            }
          }
        })
        .addDevDependencies({
          'eslint-import-resolver-webpack': '2.18.2'
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
