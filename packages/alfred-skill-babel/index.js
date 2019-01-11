const { getConfigPathByConfigName, execCommand } = require('@alfredpkg/core');

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
      config: {
        extends: ['@babel/preset-env']
      }
    }
  ],
  hooks: {
    call(configFiles, ctf, alfredConfig) {
      const configPath = getConfigPathByConfigName('babel', configFiles);
      const binPath = require.resolve('@babel/cli');
      return execCommand(
        [
          binPath,
          alfredConfig.showConfigs ? `--configFile ${configPath} .` : ''
        ].join(' ')
      );
    }
  },
  ctfs: {
    webpack(config) {
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
    eslint(config) {
      return config
        .extendConfig('eslint', {
          parser: 'babel-eslint'
        })
        .addDevDependencies({ 'babel-eslint': '5.0.0' });
    }
  }
};
