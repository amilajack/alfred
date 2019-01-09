module.exports = {
  name: 'react',
  description: 'A JavaScript library for building user interfaces',
  devDependencies: {
    react: '0.16.0'
  },
  ctfs: {
    // @TODO Add React HMR support
    babel(config) {
      return config
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
    },
    eslint(config) {
      return config
        .extendConfig('eslint', {
          extends: ['eslint-config-airbnb']
        })
        .addDevDependencies({ 'eslint-config-airbnb': '17.1.0' });
    }
  }
};
