const { getConfigPathByConfigName } = require('@alfredpkg/core');

module.exports = {
  name: 'jest',
  description: 'Test your JS files',
  interface: '@alfredpkg/interface-test',
  devDependencies: { jest: '5.0.0' },
  configFiles: [
    {
      name: 'jest',
      path: 'jest.config.json',
      config: {}
    }
  ],
  hooks: {
    call(configFiles) {
      const configPath = getConfigPathByConfigName('jest', configFiles);
      return `./node_modules/.bin/jest --config ${configPath}`;
    }
  },
  ctfs: {
    babel: config =>
      config.addDevDependencies({
        'babel-jest': '8.0.0'
      }),
    eslint: config =>
      config
        .addDevDependencies({
          'eslint-plugin-jest': '8.0.0'
        })
        .extendConfig('eslint', {
          plugins: ['jest']
        })
  }
};
