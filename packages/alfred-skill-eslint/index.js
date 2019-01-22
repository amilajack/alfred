const path = require('path');
const {
  getConfigPathByConfigName,
  getConfigByConfigName,
  execCommand,
  getPkgBinPath
} = require('@alfredpkg/core');

module.exports = {
  name: 'eslint',
  description: 'Lint all your JS files',
  interfaces: ['@alfredpkg/interface-lint'],
  devDependencies: { eslint: '5.10.0' },
  configFiles: [
    {
      name: 'eslint',
      path: '.eslintrc.json',
      write: true,
      config: {
        env: {
          browser: true,
          node: true
        },
        extends: ['bliss']
      }
    }
  ],
  hooks: {
    async call({ configFiles, alfredConfig, flags }) {
      const configPath = getConfigPathByConfigName('eslint', configFiles);
      const binPath = await getPkgBinPath('eslint', 'eslint');
      if (alfredConfig.showConfigs) {
        return execCommand(
          [binPath, `--config ${configPath} src tests`, ...flags].join(' ')
        );
      }
      const { config } = getConfigByConfigName('eslint', configFiles);
      const { CLIEngine } = require('eslint');
      const cli = new CLIEngine({ ...config, useEslintrc: false });
      const report = cli.executeOnFiles([
        path.join(alfredConfig.root, 'src'),
        path.join(alfredConfig.root, 'tests')
      ]);
      const formatter = cli.getFormatter();
      console.log(formatter(report.results));
      return true;
    }
  },
  ctfs: {}
};
