const { getPkgBinPath, execCommand } = require('@alfredpkg/core');

module.exports = {
  name: 'prettier',
  description: 'Format all the supported files in your project',
  interface: '@alfredpkg/interface-format',
  devDependencies: { prettier: '1.15.3' },
  configFiles: [
    {
      name: 'prettier',
      path: '.prettierrc',
      config: {}
    }
  ],
  hooks: {
    async call() {
      const binPath = await getPkgBinPath('prettier');
      return execCommand(
        [
          binPath,
          '--ignore-path',
          '.gitignore',
          '--single-quote',
          '--write',
          '**/*.{*{js,jsx,json},babelrc,eslintrc,prettierrc,stylelintrc}'
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
