const {
  getConfigPathByConfigName,
  execCommand,
  getPkgBinPath
} = require('@alfred/helpers');

module.exports = {
  name: 'prettier',
  description: 'Format the source files in your project',
  interfaces: ['@alfred/interface-format'],
  devDependencies: { prettier: '1.15.3' },
  configFiles: [
    {
      name: 'prettier',
      path: '.prettierrc',
      write: true,
      config: {}
    }
  ],
  hooks: {
    async call({ configFiles, alfredConfig, flags }) {
      const binPath = await getPkgBinPath('prettier');
      const configPath = getConfigPathByConfigName('prettier', configFiles);
      return execCommand(
        [
          binPath,
          '--ignore-path',
          '.gitignore',
          '--single-quote',
          '--write',
          '**/*',
          ...flags,
          alfredConfig.showConfigs ? `--config ${configPath}` : ''
        ].join(' ')
      );
    }
  },
  ctfs: {
    eslint: config =>
      config
        .extendConfig('eslint', {
          extends: ['prettier'],
          plugins: ['prettier']
        })
        .addDependencies({
          'eslint-config-prettier': '3.3.0',
          'eslint-plugin-prettier': '3.0.1'
        })
  }
};
