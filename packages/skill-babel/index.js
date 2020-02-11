/* eslint global-require: off */
module.exports = {
  name: 'babel',
  description: 'Transpile JS from ESNext to the latest ES version',
  configs: [
    {
      alias: 'babel',
      filename: '.babelrc.js',
      config: {
        presets: ['@babel/preset-env']
      }
    }
  ],
  hooks: {},
  transforms: {
    lodash(skill) {
      return skill.addDepsFromPkg('babel-plugin-lodash').extendConfig('babel', {
        env: {
          production: {
            plugins: ['babel-plugin-lodash']
          }
        }
      });
    },
    react(skill) {
      return skill
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
