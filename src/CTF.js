import lodash from 'lodash';
import webpackMerge from 'webpack-merge';

// @flow
type CtfNode = {
  name: string,
  interfaces?: Array<string> | string,
  dependencies: {
    [x: string]: any
  },
  description: string,
  configFiles: Array<{
    name: string,
    path: string,
    config:
      | string
      | {
          [x: string]: any
        }
  }>,
  ctfs: {
    [x: string]: (CtfNode, Map<string, CtfNode>) => CtfNode
  }
};

const babel: CtfNode = {
  name: 'babel',
  description: 'Transpile JS from ESNext to the latest ES version',
  interfaces: 'alfred-interface-transpile',
  dependencies: {
    '@babel/cli': '7.2.0',
    '@babel/core': '7.2.0',
    '@babel/preset-env': '7.2.0'
  },
  configFiles: [
    {
      name: 'babel',
      path: '.babelrc.js',
      config: {
        extends: ['@babel/preset-env']
      }
    }
  ],
  ctfs: {
    webpack(config) {
      return config
        .extendConfig('webpack.base', {
          module: {
            devtool: 'source-map',
            mode: 'production',
            target: 'electron-main',
            entry: './app/main.dev',
            output: {
              path: 'app',
              filename: './app/main.prod.js'
            }
          }
        })
        .addDependencies({ 'babel-loader': '5.0.0' });
    },
    eslint(config) {
      return config
        .extendConfig('eslint', {
          parser: 'babel-eslint'
        })
        .addDependencies({ 'babel-eslint': '5.0.0' });
    }
  }
};

const eslint: CtfNode = {
  name: 'eslint',
  description: 'Lint all your JS files',
  interfaces: 'alfred-interface-lint',
  dependencies: { eslint: '5.0.0' },
  configFiles: [
    {
      name: 'eslint',
      path: '.eslintrc.json',
      config: {
        extends: ['bliss']
      }
    }
  ],
  ctfs: {}
};

const webpack: CtfNode = {
  name: 'webpack',
  description: 'Build, optimize, and bundle assets in your app',
  interfaces: 'alfred-interface-build',
  dependencies: { webpack: '5.0.0' },
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
          path: "path.join(__dirname, '..', 'app')",
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

const react: CtfNode = {
  name: 'react',
  description:
    'A declarative, efficient, and flexible JavaScript library for building user interfaces',
  dependencies: { react: '0.16.0' },
  configFiles: [
    {
      name: 'root',
      path: 'containers/Root.js',
      config: `
        import React, { Component } from 'react';

        export default class Root extends Component {
          render() {
            const { store, history } = this.props;
            return (
              <Provider store={store}>
                <ConnectedRouter history={history}>
                  <Routes />
                </ConnectedRouter>
              </Provider>
            );
          }
        }
      `
    },
    {
      name: 'app',
      path: 'containers/App.js',
      config: `
        import * as React from 'react';

        export default class App extends React.Component {
          render() {
            const { children } = this.props;
            return <React.Fragment>{children}</React.Fragment>;
          }
        }
      `
    }
  ],
  ctfs: {
    eslint: config =>
      config
        .addDependencies({
          'eslint-plugin-react': '7.0.0'
        })
        .extendConfig('eslint', {
          plugins: ['react']
        }),
    jest: config =>
      config.extendConfig('jest', {
        moduleFileExtensions: ['js', 'jsx', 'json']
      }),
    babel: config =>
      config
        .extendConfig('babel', {
          plugins: ['@babel/preset-react']
        })
        .addDependencies({
          '@babel/preset-react': '7.0.0'
        }),
    webpack: config => {
      const newConfig = webpackMerge.smart(
        config.findConfig('webpack.base').config,
        {
          resolve: {
            extensions: ['.jsx']
          }
        }
      );
      return config.replaceConfig('webpack.base', {
        ...config.findConfig('webpack.base'),
        config: newConfig
      });
    }
  }
};

const jestCtf: CtfNode = {
  name: 'jest',
  description: 'Test your JS files',
  interfaces: 'alfred-interface-test',
  dependencies: { jest: '5.0.0' },
  configFiles: [
    {
      name: 'jest',
      path: 'jest.config.js',
      config: {}
    }
  ],
  ctfs: {
    babel: config =>
      config.addDependencies({
        'babel-jest': '8.0.0'
      }),
    eslint: config =>
      config
        .addDependencies({
          'eslint-plugin-jest': '8.0.0'
        })
        .extendConfig('eslint', {
          plugins: ['jest']
        })
  }
};

export const CTFS = { jest: jestCtf, react, webpack, eslint, babel };

type CtfHelpers = {
  findConfig: (configName: string) => { [x: string]: string },
  addDependencies: ({ [x: string]: string }) => { [x: string]: string },
  extendConfig: (x: string) => CtfNode,
  replaceConfig: (x: string) => CtfNode
};

const AddCtfHelpers: CtfHelpers = {
  findConfig(configName: string) {
    const config = this.configFiles.find(
      configFile => configFile.name === configName
    );
    if (!config) {
      throw new Error(`Cannot find config with name "${configName}"`);
    }
    return config;
  },
  extendConfig(
    configName: string,
    configExtension: { [x: string]: string } = {}
  ): CtfNode {
    const foundConfig = this.findConfig(configName);
    const mergedConfigFile = lodash.merge({}, foundConfig, {
      config: configExtension
    });
    const configFiles = this.configFiles.map(configFile =>
      configFile.name === configName ? mergedConfigFile : configFile
    );
    return lodash.merge({}, this, {
      configFiles
    });
  },
  replaceConfig(
    configName: string,
    configReplacement: { [x: string]: string } = {}
  ) {
    const configFiles = this.configFiles.map(configFile =>
      configFile.name === configName ? configReplacement : configFile
    );
    return {
      ...this,
      configFiles
    };
  },
  addDependencies(dependencies) {
    return lodash.merge({}, this, {
      dependencies
    });
  }
};

export default function CTF(ctfs: Array<CtfNode>): Map<string, CtfNode> {
  const map: Map<string, CtfNode> = new Map();

  ctfs.forEach(_ctf => {
    const ctfWithHelpers = {
      ..._ctf,
      ...AddCtfHelpers
    };
    map.set(_ctf.name, ctfWithHelpers);
  });

  map.forEach(ctf => {
    Object.entries(ctf.ctfs || {}).forEach(([ctfName, ctfFn]) => {
      const correspondingCtfNode = map.get(ctfName);
      if (correspondingCtfNode) {
        map.set(ctfName, ctfFn(correspondingCtfNode, map));
      }
    });
  });

  return map;
}

// Intended to be used for testing purposes
export function getConfigs(
  ctf: Map<string, CtfNode>
): Array<{ [x: string]: any }> {
  return Array.from(ctf.values())
    .map(_ctf => _ctf.configFiles)
    .reduce((p, c) => [...p, ...c], [])
    .map(e => e.config);
}

// Intended to be used for testing purposes
export function getDependencies(
  ctf: Map<string, CtfNode>
): { [x: string]: string } {
  return Array.from(ctf.values())
    .map(_ctf => _ctf.dependencies)
    .reduce((p, c) => ({ ...p, ...c }), {});
}
