/* eslint global-require: off */
const path = require('path');
const {
  getConfigPathByConfigName,
  getConfigByConfigName,
  getPkgBinPath,
  execCommand
} = require('@alfred/helpers');

module.exports = {
  name: 'eslint',
  description: 'Lint all your JS files',
  interfaces: ['@alfred/interface-lint'],
  devDependencies: require('./package.json').devDependencies,
  configFiles: [
    {
      name: 'eslint',
      path: '.eslintrc.json',
      write: true,
      config: {
        root: true,
        env: {
          browser: true,
          node: true
        },
        extends: ['bliss'],
        rules: {
          'flowtype-errors/show-errors': 'off'
        }
      }
    }
  ],
  hooks: {
    async call({ project, config, configFiles, flags }) {
      const configPath = getConfigPathByConfigName('eslint', configFiles);
      const binPath = await getPkgBinPath('eslint', 'eslint');
      if (config.showConfigs) {
        return execCommand(
          project,
          [binPath, `--config ${configPath} src tests`, ...flags].join(' ')
        );
      }
      const { config: eslintConfig } = getConfigByConfigName(
        'eslint',
        configFiles
      );
      const { CLIEngine } = require('eslint');
      const cli = new CLIEngine({
        cwd: project.root,
        useEslintrc: false,
        root: true,
        baseConfig: eslintConfig
      });
      const report = cli.executeOnFiles([
        path.join(project.root, 'src'),
        path.join(project.root, 'tests')
      ]);
      const formatter = cli.getFormatter();
      if (report.errorCount) {
        throw new Error(formatter(report.results));
      } else {
        console.log(formatter(report.results));
      }

      return true;
    }
  },
  ctfs: {}
};
