const { getConfigPathByConfigName } = require('@alfredpkg/core');
const childProcess = require('child_process');

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
    call(configFiles) {
      const configPath = getConfigPathByConfigName('eslint', configFiles);
      childProcess.execSync(
        `./node_modules/.bin/eslint --config ${configPath} .`,
        {
          stdio: [0, 1, 2]
        }
      );
    }
  },
  ctfs: {}
};