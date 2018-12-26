import lodash from 'lodash';

// @flow
type CmfNode = {
  name: string,
  interface: Array<string>,
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
    [x: string]: (CmfNode, Array<CmfNode>) => CmfNode
  }
};

const babel: CmfNode = {
  name: 'babel',
  interface: ['alfred-interface-transpile'],
  dependencies: [
    '@babel/cli@7.2.0',
    '@babel/core@7.2.0',
    '@babel/preset-env@7.2.0'
  ],
  description: 'Transpile JS from ESNext to the latest ES version',
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
        file.name === 'webpack.prod'
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

const eslint: CmfNode = {
  name: 'eslint',
  interface: ['alfred-interface-lint'],
  dependencies: ['@eslint@5.0.0'],
  description: 'Lint all your JS files',
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

const webpack: CmfNode = {
  name: 'webpack',
  interface: ['alfred-interface-lint'],
  dependencies: ['@eslint@5.0.0'],
  description: 'Lint all your JS files',
  files: [
    {
      name: 'webpack.prod',
      path: 'webpack.prod.js',
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

const map: Map<string, CmfNode> = new Map();
map.set('babel', babel);
map.set('eslint', eslint);
map.set('webpack', webpack);

export default map;
