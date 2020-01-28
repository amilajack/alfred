/* eslint global-require: off */
const webpack = require('webpack');
const path = require('path');
const {
  getConfigByConfigName,
  getConfigsBasePath
} = require('@alfred/helpers');
const { default: mergeConfigs } = require('@alfred/merge-configs');
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
  devDependencies: require('./package.json').peerDependencies,
  configFiles: [
    {
      name: 'webpack.base',
      path: 'webpack.base.json',
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
      path: 'webpack.prod.json',
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
      path: 'webpack.dev.json',
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
      path: 'webpack.node.json',
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
      path: 'webpack.browser.json',
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
    async call({ project, configFiles, interfaceState, subcommand }) {
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

      // @HACK: The following lines should be replaced with an algorithm that
      //        recursively traverses and object and replaces each project root
      if (mergedConfig.output && mergedConfig.output.path) {
        mergedConfig.output.path = replaceProjectRoot(
          mergedConfig.output.path,
          project.root
        );
      }
      if (mergedConfig.devServer && mergedConfig.devServer.contentBase) {
        mergedConfig.devServer.contentBase = replaceProjectRoot(
          mergedConfig.devServer.contentBase,
          project.root
        );
      }
      if (mergedConfig.entry) {
        if (Array.isArray(mergedConfig.entry)) {
          mergedConfig.entry = mergedConfig.entry.map(entry =>
            replaceProjectRoot(entry, project.root)
          );
        } else {
          mergedConfig.entry = replaceProjectRoot(
            mergedConfig.entry,
            project.root
          );
        }
      }

      switch (subcommand) {
        case 'start': {
          const Webpack = require('webpack');
          const WebpackDevServer = require('webpack-dev-server');
          WebpackDevServer.addDevServerEntrypoints(mergedConfig, {
            contentBase: path.join(project.root, 'src'),
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
    babel(ctf, { toCtf }) {
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
                    ...getConfigByConfigName('babel', toCtf.configFiles).config,
                    cacheDirectory: true
                  }
                }
              }
            ]
          }
        })
        .addDevDependencies({ 'babel-loader': '8.0.0' });
    },
    lodash(ctf) {
      // eslint-disable-next-line global-require
      const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
      return ctf
        .addDevDependencies({
          'lodash-webpack-plugin': require('./package.json').devDependencies[
            'lodash-webpack-plugin'
          ]
        })
        .extendConfig('webpack.prod', {
          plugins: [new LodashModuleReplacementPlugin()]
        });
    },
    react(ctf) {
      // eslint-disable-next-line global-require
      const webpack = require('webpack');
      return ctf.extendConfig('webpack.base', {
        resolve: {
          extensions: ['.jsx']
        },
        devServer: {
          hot: true
        },
        plugins: [new webpack.HotModuleReplacementPlugin()]
      });
    }
  }
};
