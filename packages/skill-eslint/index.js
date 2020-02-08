/* eslint global-require: off */
const path = require('path');
const {
  getConfigPathByConfigName,
  getConfigByName,
  getPkgBinPath,
  execCmdInProject
} = require('@alfred/helpers');

module.exports = {
  name: 'eslint',
  description: 'Lint all your JS files',
  interfaces: ['@alfred/interface-lint'],
  configFiles: [
    {
      name: 'eslint',
      path: '.eslintrc.js',
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
    async run({ project, config, configFiles, flags }) {
      const configPath = getConfigPathByConfigName('eslint', configFiles);
      const binPath = await getPkgBinPath(project, 'eslint');
      if (config.showConfigs) {
        return execCmdInProject(
          project,
          [binPath, `--config ${configPath} src tests`, ...flags].join(' ')
        );
      }
      const { config: eslintConfig } = getConfigByName('eslint', configFiles);
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
  transforms: {
    babel(skill) {
      return skill
        .extendConfig('eslint', {
          parser: 'babel-eslint'
        })
        .addDepsFromPkg('babel-eslint');
    },
    jest(skill) {
      return skill.addDepsFromPkg('eslint-plugin-jest').extendConfig('eslint', {
        plugins: ['jest']
      });
    },
    mocha(skill) {
      return skill
        .extendConfig('eslint', {
          plugins: ['mocha']
        })
        .addDepsFromPkg('eslint-plugin-mocha');
    },
    webpack(skill, { project, config, skillMap, configsDir }) {
      return skill
        .extendConfig('eslint', {
          settings: {
            'import/resolver': {
              webpack: {
                config: path.join(
                  project.root,
                  config.configsDir,
                  getConfigPathByConfigName(
                    'webpack.base',
                    skillMap.get('webpack').configFiles
                  )
                )
              }
            }
          }
        })
        .addDepsFromPkg('eslint-import-resolver-webpack');
    },
    react(skill) {
      return skill
        .extendConfig('eslint', {
          extends: ['airbnb']
        })
        .addDepsFromPkg('eslint-config-airbnb');
    },
    prettier(skill) {
      return skill
        .extendConfig('eslint', {
          extends: ['prettier'],
          plugins: ['prettier']
        })
        .addDepsFromPkg(['eslint-config-prettier', 'eslint-plugin-prettier']);
    }
  }
};
