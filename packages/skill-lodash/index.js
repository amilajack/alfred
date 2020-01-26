module.exports = {
  name: 'lodash',
  description: 'lodash optimizations for your app',
  devDependencies: require('./package.json').devDependencies,
  configFiles: [],
  ctfs: {
    webpack(ctf) {
      // eslint-disable-next-line global-require
      const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
      return ctf
        .addDevDependencies({
          'lodash-webpack-plugin': require('./package.json').devDependencies[
            'lodash-webpack-plugin'
          ]
        })
        .extendConfig('webpack.prod', {
          plugins: [new LodashModuleReplacementPlugin()]
        });
    },
    /**
     * @TODO Don't perform this transformation for library targets
     */
    babel(ctf) {
      return ctf
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
