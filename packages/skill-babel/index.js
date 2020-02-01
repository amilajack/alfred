/* eslint global-require: off */
const { getConfigByName } = require('@alfred/helpers');

module.exports = {
  name: 'babel',
  description: 'Transpile JS from ESNext to the latest ES version',
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
  transforms: {
    /**
     * @TODO Don't perform this transformation for library targets
     */
    lodash(skillNode) {
      return skillNode
        .addDepsFromPkg('babel-plugin-lodash')
        .extendConfig('babel', {
          env: {
            production: {
              plugins: ['babel-plugin-lodash']
            }
          }
        });
    },
    /**
     * @TODO Add React HMR support
     */
    react(skillNode) {
      return skillNode
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
        .addDepsFromPkg([
          '@babel/preset-react',
          'babel-plugin-dev-expression',
          'babel-plugin-transform-react-remove-prop-types',
          '@babel/plugin-transform-react-constant-elements',
          '@babel/plugin-transform-react-inline-elements',
          'react-hot-loader'
        ]);
    }
  }
};
