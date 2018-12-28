import lodash from 'lodash';

// @flow
type CtfNode = {
  name: string,
  interfaces: Array<string> | string,
  dependencies: {
    [x: string]: any
  },
  description: string,
  configFiles: Array<{
    name: string,
    path: string,
    config: {
      [x: string]: any
    }
  }>,
  ctfs: {
    [x: string]: (CtfNode, Map<string, CtfNode>) => CtfNode
  }
};

export const babel: CtfNode = {
  name: 'babel',
  description: 'Transpile JS from ESNext to the latest ES version',
  interfaces: 'alfred-interface-transpile',
  dependencies: {
    '@babel/cli': '7.2.0',
    '@babel/core': '7.2.0',
    '@babel/preset': 'env@7.2.0'
  },
  configFiles: [
    {
      name: 'babelrc',
      path: '.babelrc.js',
      config: {
        extends: '@babel/preset-env'
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

export const eslint: CtfNode = {
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

export const webpack: CtfNode = {
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
          extensions: ['.js', '.jsx', '.json']
        },
        plugins: []
      }
    }
  ],
  ctfs: {}
};

type CtfHelpers = {
  findConfig: (configName: string) => { [x: string]: string },
  addDependencies: ({ [x: string]: string }) => { [x: string]: string },
  extendConfig: (x: string) => CtfNode
};

const AddCtfHelpers: CtfHelpers = {
  findConfig(configName: string) {
    return this.configFiles.find(configFile => configFile.name === configName);
  },
  extendConfig(
    configName: string,
    configExtension: { [x: string]: string } = {}
  ): CtfNode {
    const foundConfig = this.findConfig(configName);
    if (!foundConfig) {
      return this;
    }
    const mergedConfigFile = lodash.merge(foundConfig, {
      config: configExtension
    });
    const configFiles = this.configFiles.map(configFile =>
      configFile.name === configName ? mergedConfigFile : configFile
    );
    return lodash.merge(this, {
      configFiles
    });
  },
  addDependencies(dependencies) {
    return lodash.merge(this, {
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
    .map(([config]) => config.config);
}

// Intended to be used for testing purposes
export function getDependencies(
  ctf: Map<string, CtfNode>
): { [x: string]: string } {
  return Array.from(ctf.values())
    .map(_ctf => _ctf.dependencies)
    .reduce((p, c) => ({ ...p, ...c }), {});
}
