import lodash from 'lodash';

// @flow
type CtfNode = {
  name: string,
  interfaces: Array<string> | string,
  dependencies: {
    [x: string]: any
  },
  description: string,
  files: Array<{
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
  files: [
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
      const { files, dependencies } = config;
      const newFiles = files.map(file =>
        file.name === 'webpack.base'
          ? {
              ...file,
              config: lodash.merge(file.config, {
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
                }
              })
            }
          : file
      );
      return {
        ...config,
        dependencies: {
          ...dependencies,
          'babel-loader': '5.0.0'
        },
        files: newFiles
      };
    },
    eslint(config) {
      const { files, dependencies } = config;
      const newFiles = files.map(file =>
        file.name === 'eslint'
          ? {
              ...file,
              config: lodash.merge(file.config, {
                parser: 'babel-eslint'
              })
            }
          : file
      );
      return {
        ...config,
        dependencies: {
          ...dependencies,
          'babel-eslint': '5.0.0'
        },
        files: newFiles
      };
    }
  }
};

export const eslint: CtfNode = {
  name: 'eslint',
  description: 'Lint all your JS files',
  interfaces: 'alfred-interface-lint',
  dependencies: { eslint: '5.0.0' },
  files: [
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
  files: [
    {
      name: 'webpack.base',
      path: 'webpack.base.js',
      config: {
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
      }
    }
  ],
  ctfs: {}
};

export default function CTF(ctfs: Array<CtfNode>): Map<string, CtfNode> {
  const map: Map<string, CtfNode> = new Map();

  ctfs.forEach(_ctf => {
    map.set(_ctf.name, _ctf);
  });

  map.forEach(ctf => {
    const ctfNames = Object.keys(ctf.ctfs);
    ctfNames.forEach(ctfName => {
      const correspondingCtfNode = map.get(ctfName);
      if (correspondingCtfNode) {
        map.set(ctfName, ctf.ctfs[ctfName](correspondingCtfNode, map));
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
    .map(_ctf => _ctf.files)
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
