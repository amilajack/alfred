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
  ctfs: {
    babel(ctf) {
      return ctf
        .extendConfig('eslint', {
          parser: 'babel-eslint'
        })
        .addDevDependencies({ 'babel-eslint': '10.0.0' });
    },
    jest(ctf) {
      return ctf
        .addDevDependencies({
          'eslint-plugin-jest': '23.6.0'
        })
        .extendConfig('eslint', {
          plugins: ['jest']
        });
    },
    mocha(ctf) {
      return ctf
        .extendConfig('eslint', {
          plugins: ['mocha']
        })
        .addDevDependencies({
          'eslint-plugin-mocha': '6.2.2'
        });
    },
    webpack(eslintCtf, { project, config }) {
      return eslintCtf
        .extendConfig('eslint', {
          settings: {
            'import/resolver': {
              webpack: {
                config: path.join(
                  getConfigsBasePath(project, config),
                  'webpack.browser.json'
                )
              }
            }
          }
        })
        .addDevDependencies({
          'eslint-import-resolver-webpack': '0.12.1'
        });
    },
    prettier(ctf) {
      return ctf
        .extendConfig('eslint', {
          extends: ['prettier'],
          plugins: ['prettier']
        })
        .addDevDependencies({
          'eslint-config-prettier': '6.9.0',
          'eslint-plugin-prettier': '3.0.1'
        });
    },
    react(ctf) {
      return ctf
        .extendConfig('eslint', {
          extends: ['eslint-config-airbnb']
        })
        .addDevDependencies({ 'eslint-config-airbnb': '18.0.0' });
    }
  }
};
