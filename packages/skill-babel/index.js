/* eslint global-require: off */
const { getConfigByConfigName } = require('@alfred/helpers');

module.exports = {
  name: 'babel',
  description: 'Transpile JS from ESNext to the latest ES version',
  devDependencies: require('./package.json').devDependencies,
  configFiles: [
    {
      name: 'babel',
      path: '.babelrc.json',
      write: true,
      config: {
        presets: ['@babel/preset-env']
      }
    }
  ],
  hooks: {},
  ctfs: {
    /**
     * @TODO Don't perform this transformation for library targets
     */
    lodash(ctfNode) {
      return ctfNode
        .addDevDependencies({
          'babel-plugin-lodash': '3.3.4'
        })
        .extendConfig('babel', {
          env: {
            production: {
              plugins: ['babel-plugin-lodash']
            }
          }
        });
    },
    // @TODO Add React HMR support
    react(ctfNode) {
      return ctfNode
        .extendConfig('babel', {
          presets: ['@babel/preset-react'],
          env: {
            production: {
              plugins: [
                'babel-plugin-dev-expression',
                // babel-preset-react-optimize plugins extracted here
                '@babel/plugin-transform-react-constant-elements',
                '@babel/plugin-transform-react-inline-elements',
                'babel-plugin-transform-react-remove-prop-types'
              ]
            },
            development: {
              plugins: ['react-hot-loader/babel']
            }
          }
        })
        .addDevDependencies({
          '@babel/preset-react': '7.0.0',
          'babel-plugin-dev-expression': '^0.2.1',
          'babel-plugin-transform-react-remove-prop-types': '^0.4.20',
          '@babel/plugin-transform-react-constant-elements': '^7.0.0',
          '@babel/plugin-transform-react-inline-elements': '^7.0.0',
          'react-hot-loader': '^4.3.12'
        });
    }
  }
};
