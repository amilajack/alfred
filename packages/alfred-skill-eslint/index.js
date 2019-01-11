const { getConfigPathByConfigName, execCommand } = require('@alfredpkg/core');

module.exports = {
  name: 'eslint',
  description: 'Lint all your JS files',
  interface: '@alfredpkg/interface-lint',
  devDependencies: { eslint: '5.10.0' },
  configFiles: [
    {
      name: 'eslint',
      path: '.eslintrc.json',
      config: {
        extends: ['bliss']
      }
    }
  ],
  hooks: {
    call(configFiles, ctf, alfredConfig) {
      const configPath = getConfigPathByConfigName('eslint', configFiles);
      const binPath = require.resolve('eslint');
      return execCommand(
        [
          binPath,
          alfredConfig.showConfigs ? `--config ${configPath} .` : ''
        ].join(' ')
      );
    }
  },
  ctfs: {}
};
