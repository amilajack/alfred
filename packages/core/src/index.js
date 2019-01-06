import lodash from 'lodash';
import path from 'path';
import rimraf from 'rimraf';
import fs from 'fs';
import childProcess from 'child_process';
import npm from 'npm';
import webpackMerge from 'webpack-merge';

// @TODO: send the information to a crash reporting service (like sentry.io)
process.on('unhandledRejection', err => {
  throw new Error(err);
});

export type configFileType = {
  // The "friendly name" of a file. This is the name that
  // other CTFs will refer to config file by.
  name: string,
  // The relative path of the file the config should be written to
  path: string,
  // The value of the config
  config:
    | string
    | {
        [x: string]: any
      }
};

type UsingInterface = {
  interface: string,
  hooks: {
    call: (fileConfigPath: string, config: configFileType) => string,
    install?: () => void
  }
};

// @flow
type RequiredCtfNodeParams = {|
  name: string,
  dependencies: {
    [x: string]: any
  },
  devDependencies: {
    [x: string]: any
  },
  description: string,
  configFiles: Array<configFileType>,
  ctfs: {
    [x: string]: (
      RequiredCtfNodeParams,
      Map<string, RequiredCtfNodeParams>
    ) => RequiredCtfNodeParams
  }
|};

export type CtfNode =
  | RequiredCtfNodeParams
  | {| ...UsingInterface, ...RequiredCtfNodeParams |};

export type CtfMap = Map<string, CtfNode>;

export function getConfigByConfigName(
  configName,
  configFiles: Array<configFileType>
) {
  const config = configFiles.find(e => e.name === configName);
  if (!config) throw new Error(`Cannot find config by name "${configName}"`);
  return config;
}

export function getConfigPathByConfigName(
  configName,
  configFiles: Array<configFileType>
) {
  const config = configFiles.find(e => e.name === configName);
  if (!config) throw new Error(`Cannot find config by name "${configName}"`);
  return config.path;
}

const babel: CtfNode = {
  name: 'babel',
  description: 'Transpile JS from ESNext to the latest ES version',
  interface: '@alfredpkg/interface-transpile',
  devDependencies: {
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
  hooks: {
    call(configFiles: Array<configFileType>) {
      const configPath = getConfigPathByConfigName('babel', configFiles);
      return `./node_modules/.bin/babel --configFile ${configPath}`;
    }
  },
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
        .addDevDependencies({ 'babel-loader': '5.0.0' });
    },
    eslint(config) {
      return config
        .extendConfig('eslint', {
          parser: 'babel-eslint'
        })
        .addDevDependencies({ 'babel-eslint': '5.0.0' });
    }
  }
};

const eslint: CtfNode = {
  name: 'eslint',
  description: 'Lint all your JS files',
  interface: '@alfredpkg/interface-lint',
  devDependencies: { eslint: '5.0.0' },
  configFiles: [
    {
      name: 'eslint',
      path: '.eslintrc.json',
      config: {
        extends: ['bliss']
      }
    }
  ],
  hooks: {
    call(configFiles: Array<configFileType>) {
      const configPath = getConfigPathByConfigName('eslint', configFiles);
      return `./node_modules/.bin/eslint --config ${configPath}`;
    }
  },
  ctfs: {}
};

const webpack: CtfNode = {
  name: 'webpack',
  description: 'Build, optimize, and bundle assets in your app',
  interface: '@alfredpkg/interface-build',
  devDependencies: { webpack: '4.28.3' },
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
  hooks: {
    call(configFiles: Array<configFileType>) {
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

const react: CtfNode = {
  name: 'react',
  description:
    'A declarative, efficient, and flexible JavaScript library for building user interfaces',
  devDependencies: { react: '0.16.0' },
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
        .addDevDependencies({
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
        .addDevDependencies({
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

// Can't use the identifier `jest` because collides with `jest` global when running
// tests 😢
const jestCtf: CtfNode = {
  name: 'jest',
  description: 'Test your JS files',
  interface: '@alfredpkg/interface-test',
  devDependencies: { jest: '5.0.0' },
  configFiles: [
    {
      name: 'jest',
      path: 'jest.config.js',
      config: {}
    }
  ],
  hooks: {
    call(configFiles: Array<configFileType>) {
      const configPath = getConfigPathByConfigName('jest', configFiles);
      return `./node_modules/.bin/jest --config ${configPath}`;
    }
  },
  ctfs: {
    babel: config =>
      config.addDevDependencies({
        'babel-jest': '8.0.0'
      }),
    eslint: config =>
      config
        .addDevDependencies({
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
  addDevDependencies: ({ [x: string]: string }) => { [x: string]: string },
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
  },
  addDevDependencies(devDependencies) {
    return lodash.merge({}, this, {
      devDependencies
    });
  }
};
export default function CTF(ctfs: Array<CtfNode>): CtfMap {
  const map: CtfMap = new Map();
  ctfs.forEach(ctfNode => {
    const ctfWithHelpers = {
      ...ctfNode,
      ...AddCtfHelpers
    };
    map.set(ctfNode.name, ctfWithHelpers);
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
/*
 * Intended to be used for testing purposes
 */
export function getConfigs(ctf: CtfMap): Array<{ [x: string]: any }> {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.configFiles)
    .reduce((p, c) => [...p, ...c], [])
    .map(e => e.config);
}
/**
 * Write configs to a './.configs' directory
 */
export async function writeConfigsFromCtf(ctf: CtfMap) {
  const configsBasePath = path.join(process.cwd(), '.configs');
  // Delete .configs dir
  await new Promise(resolve => {
    rimraf(configsBasePath, () => {
      resolve();
    });
  });
  // Create a new .configs dir and write the configs
  const configs = Array.from(ctf.values())
    .map(ctfNode => ctfNode.configFiles)
    .reduce((p, c) => [...p, ...c], []);
  await fs.promises.mkdir(configsBasePath);
  await Promise.all(
    configs.map(config => {
      const filePath = path.join(configsBasePath, config.path);
      const convertedConfig =
        typeof config === 'string' ? config : JSON.stringify(config.config);
      return fs.promises.writeFile(filePath, convertedConfig);
    })
  );
}
/**
 * Intended to be used for testing purposes
 */
export function getDependencies(ctf: CtfMap): { [x: string]: string } {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.dependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
}
export function getDevDependencies(ctf: CtfMap): { [x: string]: string } {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.devDependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
}
export function execCommand(installScript: string) {
  childProcess.execSync(installScript, { stdio: [0, 1, 2] });
}
export function installDeps(dependencies: Array<string> = []) {
  return new Promise((resolve, reject) => {
    npm.load(err => {
      if (err) reject(err);

      npm.commands.install(dependencies, (_err, data) => {
        if (_err) reject(_err);
        resolve(data);
      });

      npm.on('log', message => {
        console.log(message);
      });
    });
  });
}
export function getExecuteWrittenConfigsMethods(ctf: CtfMap) {
  const configsBasePath = path.join(process.cwd(), '.configs');
  return Array.from(ctf.values())
    .filter(
      ctfNode =>
        ctfNode.hooks && ctfNode.configFiles.length && ctfNode.interface
    )
    .map(ctfNode => {
      const configFiles = ctfNode.configFiles.map(configFile => ({
        ...configFile,
        path: path.join(configsBasePath, configFile.path)
      }));
      const { subcommand } = require(ctfNode.interface); // eslint-disable-line
      return {
        fn: () => {
          try {
            ctfNode.hooks.call(configFiles);
          } catch (e) {} // eslint-disable-line
        },
        // @HACK: If interfaces were defined, we could import the @alfredpkg/interface-*
        //        and use the `subcommand` property. This should be done after we have
        //        some interfaces to work with
        subcommand
      };
    })
    .reduce(
      (p, c) => ({
        ...p,
        [c.subcommand]: c.fn
      }),
      {}
    );
}
