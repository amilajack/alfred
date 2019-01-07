const { getConfigPathByConfigName } = require('@alfredpkg/core');
const childProcess = require('child_process');

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
    call(configFiles) {
      const configPath = getConfigPathByConfigName('prettier', configFiles);
      const cmd = [
        './node_modules/.bin/prettier',
        '--ignore-path',
        '.eslintignore',
        '--single-quote',
        '--write',
        '**/*.{*{js,jsx,json},babelrc,eslintrc,prettierrc,stylelintrc}',
        `--config ${configPath}`
      ].join(' ');
      childProcess.execSync(cmd, {
        stdio: [0, 1, 2]
      });
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
