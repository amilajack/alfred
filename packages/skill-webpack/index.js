/* eslint global-require: off */
const webpack = require('webpack');
const path = require('path');
const {
  configStringify,
  configSerialize,
  configDeserialize,
  configToEvalString
} = require('@alfred/helpers');
const { default: mergeConfigs } = require('@alfred/merge-configs');
const getPort = require('get-port');

function replaceProjectRoot(pathConfig, projectRoot) {
  return pathConfig.replace('<projectRoot>', projectRoot);
}

const interfaceConfig = {
  supports: {
    // Flag name and argument types
    envs: ['production', 'development', 'test'],
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
  configs: [
    {
      alias: 'webpack.base',
      filename: 'webpack.base.js',
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
      alias: 'webpack.prod',
      filename: 'webpack.prod.js',
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
      alias: 'webpack.dev',
      filename: 'webpack.dev.js',
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
          configStringify`
            new webpack.HotModuleReplacementPlugin({
              multiStep: true
            })
          `
        ]
      }
    },
    {
      alias: 'webpack.node',
      filename: 'webpack.node.js',
      config: {
        entry: [path.join('<projectRoot>', 'src', 'app.node.js')],
        output: {
          filename: 'app.node.js'
        },
        target: 'node'
      }
    },
    {
      alias: 'webpack.browser',
      filename: 'webpack.browser.js',
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
    async run({ project, skill, configs, data }) {
      const { config: baseConfig } = skill.configs.get('webpack.base');
      const { config: prodConfig } = skill.configs.get('webpack.prod');
      const { config: devConfig } = skill.configs.get('webpack.dev');
      const { config: nodeConfig } = skill.configs.get('webpack.node');
      const { config: browserConfig } = skill.configs.get('webpack.browser');

      const { interfaceState } = data;

      let mergedConfig = mergeConfigs(
        baseConfig,
        interfaceState.env === 'production' ? prodConfig : devConfig,
        interfaceState.target === 'browser' ? browserConfig : nodeConfig
      );

      mergedConfig = eval(
        `(${configToEvalString(configSerialize(mergedConfig))})`
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

      switch (data.subcommand) {
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
          throw new Error(`Invalid subcommand: "${data.subcommand}"`);
      }
    }
  },
  transforms: {
    babel(skill, { toSkill }) {
      return skill
        .extendConfig('webpack.base', {
          module: {
            rules: [
              {
                test: configStringify`/\.jsx?$/`,
                exclude: configStringify`/node_modules/`,
                use: {
                  loader: 'babel-loader',
                  options: {
                    ...toSkill.configs.get('babel').config,
                    cacheDirectory: true
                  }
                }
              }
            ]
          }
        })
        .addDepsFromPkg('babel-loader');
    },
    lodash(skill) {
      return skill
        .extendConfig('webpack.prod', {
          plugins: [
            configStringify`(() => {
              const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
              return new LodashModuleReplacementPlugin()
            })()`
          ]
        })
        .addDepsFromPkg('lodash-webpack-plugin');
    },
    react(skill) {
      // eslint-disable-next-line global-require
      const webpack = require('webpack');
      return skill.extendConfig('webpack.base', {
        resolve: {
          extensions: ['.jsx']
        },
        devServer: {
          hot: true
        },
        plugins: [configStringify`new webpack.HotModuleReplacementPlugin()`]
      });
    }
  }
};
