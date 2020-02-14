import webpack from 'webpack';
import path from 'path';
import {
  configStringify,
  configSerialize,
  configToEvalString
} from '@alfred/helpers';
import mergeConfigs from '@alfred/merge-configs';
import {
  HookArgs,
  Skill,
  TransformArgs,
  RunEvent,
  RawSkill,
  SkillConfig,
  Env,
  Platform,
  ProjectEnum,
  ConfigValue
} from '@alfred/types';
import getPort from 'get-port';

// @HACK Should use the correct declaration for a webpack config here
interface Configuration {
  entry: string | string[];
  output: {
    path: string;
  };
  devServer: Record<string, string>;
}

function replaceProjectRoot(pathConfig: string, projectRoot: string): string {
  return pathConfig.replace('<projectRoot>', projectRoot);
}

const supports = {
  // Flag name and argument types
  envs: ['production', 'development', 'test'] as Env[],
  // All the supported targets a `build` skill should build
  // @TODO: Add node to targets
  platforms: ['browser'] as Platform[],
  // Project type
  projects: ['app'] as ProjectEnum[]
};

const shouldOpenInBrowser =
  !('ALFRED_E2E_TEST' in process.env) || process.env.ALFRED_E2E_TEST !== 'true';

const skill: RawSkill = {
  name: 'webpack',
  description: 'Build, optimize, and bundle assets in your app',
  supports,
  interfaces: [
    ['@alfred/interface-build', { supports }],
    ['@alfred/interface-start', { supports }]
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
    async run({ project, skill, event }: HookArgs): Promise<void> {
      const { config: baseConfig } = skill.configs.get(
        'webpack.base'
      ) as SkillConfig;
      const { config: prodConfig } = skill.configs.get(
        'webpack.prod'
      ) as SkillConfig;
      const { config: devConfig } = skill.configs.get(
        'webpack.dev'
      ) as SkillConfig;
      const { config: nodeConfig } = skill.configs.get(
        'webpack.node'
      ) as SkillConfig;
      const { config: browserConfig } = skill.configs.get(
        'webpack.browser'
      ) as SkillConfig;

      const { target, subcommand } = event as RunEvent;

      let mergedConfig = mergeConfigs(
        baseConfig,
        target.env === 'production' ? prodConfig : devConfig,
        target.platform === 'browser' ? browserConfig : nodeConfig
      ) as Configuration;

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
                target.env === 'production' ? 'optimized' : 'unoptimized'
              } build on ${url}`
            );
          });
        }
        case 'build': {
          console.log(
            `Building ${
              target.env === 'production' ? 'optimized' : 'unoptimized'
            } build`
          );
          webpack(mergedConfig, (err, stats) => {
            if (err) {
              console.error(err.stack || err);
              return;
            }
            const info = stats.toJson();
            if (stats.hasErrors()) {
              console.error(info.errors.toString());
            }
            if (stats.hasWarnings()) {
              console.warn(info.warnings.toString());
            }
            return;
          });
          return;
        }
        default:
          throw new Error(`Invalid subcommand: "${subcommand}"`);
      }
    }
  },
  transforms: {
    babel(skill: Skill, { toSkill }: TransformArgs): Skill {
      const babelConfig = toSkill.configs.get('babel')?.config as ConfigValue;
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
                    ...babelConfig,
                    cacheDirectory: true
                  }
                }
              }
            ]
          }
        })
        .addDepsFromPkg('babel-loader');
    },
    lodash(skill: Skill): Skill {
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
    react(skill: Skill): Skill {
      // eslint-disable-next-line global-require
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
export default skill;
