module.exports = {
  name: 'lodash',
  description: 'lodash optimizations for your app',
  dependencies: { 'lodash-es': '*' },
  configFiles: [],
  ctfs: {
    webpack(config) {
      return config
        .addDevDependencies({
          'lodash-webpack-plugin': '0.11.5'
        })
        .extendConfig('webpack.prod', {
          plugins: ['lodash-webpack-plugin']
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
