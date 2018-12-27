import lodash from 'lodash';

// @flow
type CmfNode = {
  name: string,
  interfaces: Array<string> | string,
  dependencies: Array<string>,
  description: string,
  files: Array<{
    name: string,
    path: string,
    hidden: boolean,
    config: {
      [x: string]: any
    }
  }>,
  cmfs: {
    [x: string]: (CmfNode, Map<string, CmfNode>) => CmfNode
  }
};

export const babel: CmfNode = {
  name: 'babel',
  description: 'Transpile JS from ESNext to the latest ES version',
  interfaces: 'alfred-interface-transpile',
  dependencies: [
    '@babel/cli@7.2.0',
    '@babel/core@7.2.0',
    '@babel/preset-env@7.2.0'
  ],
  files: [
    {
      name: 'babelrc',
      path: '.babelrc.js',
      hidden: true,
      config: {
        extends: '@babel/preset-env'
      }
    }
  ],
  cmfs: {
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
        dependencies: [...dependencies, 'babel-loader@5.0.0'],
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
        dependencies: [...dependencies, 'babel-eslint@5.0.0'],
        files: newFiles
      };
    }
  }
};

export const eslint: CmfNode = {
  name: 'eslint',
  description: 'Lint all your JS files',
  interfaces: 'alfred-interface-lint',
  dependencies: ['@eslint@5.0.0'],
  files: [
    {
      name: 'eslint',
      path: '.eslintrc.json',
      hidden: true,
      config: {
        extends: ['bliss']
      }
    }
  ],
  cmfs: {}
};

export const webpack: CmfNode = {
  name: 'webpack',
  description: 'Build, optimize, and bundle assets in your app',
  interfaces: 'alfred-interface-build',
  dependencies: ['@eslint@5.0.0'],
  files: [
    {
      name: 'webpack.base',
      path: 'webpack.base.js',
      hidden: true,
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
  cmfs: {}
};

export default function CMF(cmfs: Array<CmfNode>): Map<string, CmfNode> {
  const map: Map<string, CmfNode> = new Map();

  cmfs.forEach(_cmf => {
    map.set(_cmf.name, _cmf);
  });

  map.forEach(cmf => {
    const cmfNames = Object.keys(cmf.cmfs);
    cmfNames.forEach(cmfName => {
      const correspondingCmfNode = map.get(cmfName);
      if (correspondingCmfNode) {
        map.set(cmfName, cmf.cmfs[cmfName](correspondingCmfNode, map));
      }
    });
  });

  return map;
}

// Intended to be used for testing purposes
export function getConfigs(
  cmf: Map<string, CmfNode>
): Array<{ [x: string]: any }> {
  return Array.from(cmf.values())
    .map(_cmf => _cmf.files)
    .map(([config]) => config.config);
}
