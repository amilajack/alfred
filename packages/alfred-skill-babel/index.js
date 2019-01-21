const path = require('path');
const {
  getConfigPathByConfigName,
  execCommand,
  getPkgBinPath,
  getConfigByConfigName
} = require('@alfredpkg/core');

module.exports = {
  name: 'babel',
  description: 'Transpile JS from ESNext to the latest ES version',
  devDependencies: {
    '@babel/cli': '7.2.0',
    '@babel/core': '7.2.0',
    '@babel/preset-env': '7.2.0'
  },
  configFiles: [
    {
      name: 'babel',
      path: '.babelrc.js',
      write: true,
      config: {
        presets: ['@babel/preset-env']
      }
    }
  ],
  hooks: {
    async call(configFiles, ctf, alfredConfig) {
      const configPath = getConfigPathByConfigName('babel', configFiles);
      const binPath = await getPkgBinPath('@babel/cli', 'babel');
      return execCommand(
        [
          binPath,
          alfredConfig.showConfigs
            ? `--configFile ${configPath} .`
            : path.join(alfredConfig.root, 'node_modules', 'jest.config.js')
        ].join(' ')
      );
    }
  },
  ctfs: {
    webpack(config, ctf) {
      return config
        .extendConfig('webpack.base', {
          module: {
            rules: [
              {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    ...getConfigByConfigName(
                      'babel',
                      ctf.get('babel').configFiles
                    ).config,
                    cacheDirectory: true
                  }
                }
              }
            ]
          }
        })
        .addDevDependencies({ 'babel-loader': '5.0.0' });
    },
    rollup(config) {
      // eslint-disable-next-line
      const babel = require('rollup-plugin-babel');
      return config
        .extendConfig('rollup.base', {
          plugins: [babel]
        })
        .addDevDependencies({
          'rollup-plugin-babel': '4.2.0'
        });
    },
    jest(config) {
      return config
        .extendConfig('jest', {
          transform: {
            '^.+\\.jsx?$': './node_modules/jest-transformer.js'
          }
        })
        .addDevDependencies({
          'babel-jest': '23.6.0'
        });
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
