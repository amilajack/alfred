module.exports = {
  name: 'lodash',
  description: 'lodash optimizations for your app',
  devDependencies: { 'lodash-es': '*' },
  configFiles: [],
  ctfs: {
    webpack(config) {
      // eslint-disable-next-line import/no-unresolved
      const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
      return config
        .addDevDependencies({
          'lodash-webpack-plugin': '0.11.5'
        })
        .extendConfig('webpack.prod', {
          plugins: [new LodashModuleReplacementPlugin()]
        });
    },
    /**
     * @TODO Don't perform this transformation for library targets
     */
    babel(config) {
      return config
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
    }
  }
};
