import path from 'path';
import { getPkgBinPath, execCmdInProject } from '@alfred/helpers';
import {
  RawSkill,
  SkillWithHelpers,
  TransformArgs,
  SkillConfig
} from '@alfred/types';

const skill: RawSkill = {
  name: 'eslint',
  description: 'Lint all your JS files',
  interfaces: ['@alfred/interface-lint'],
  configs: [
    {
      alias: 'eslint',
      filename: '.eslintrc.js',
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
    async run({ project, skill, config, event }): Promise<void> {
      const { flags } = event;
      const configPath = path.join(
        config.configsDir,
        skill.configs.get('eslint')?.filename as string
      );
      const binPath = await getPkgBinPath(project, 'eslint');
      if (config.showConfigs) {
        execCmdInProject(
          project,
          [binPath, `--config ${configPath} src tests`, ...flags].join(' ')
        );
      }
      const { config: eslintConfig } = skill.configs.get(
        'eslint'
      ) as SkillConfig;
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
    }
  },
  transforms: {
    babel(skill: SkillWithHelpers): SkillWithHelpers {
      return skill
        .extendConfig('eslint', {
          parser: 'babel-eslint'
        })
        .addDepsFromPkg('babel-eslint');
    },
    jest(skill: SkillWithHelpers): SkillWithHelpers {
      return skill.addDepsFromPkg('eslint-plugin-jest').extendConfig('eslint', {
        plugins: ['jest']
      });
    },
    mocha(skill: SkillWithHelpers): SkillWithHelpers {
      return skill
        .extendConfig('eslint', {
          plugins: ['mocha']
        })
        .addDepsFromPkg('eslint-plugin-mocha');
    },
    webpack(
      skill: SkillWithHelpers,
      { toSkill, project, config }: TransformArgs
    ): SkillWithHelpers {
      return skill
        .extendConfig('eslint', {
          settings: {
            'import/resolver': {
              webpack: {
                config: path.join(
                  project.root,
                  config.configsDir,
                  toSkill.configs.get('webpack.base').filename
                )
              }
            }
          }
        })
        .addDepsFromPkg('eslint-import-resolver-webpack');
    },
    react(skill: SkillWithHelpers): SkillWithHelpers {
      return skill
        .extendConfig('eslint', {
          extends: ['airbnb'],
          rules: {
            'react/jsx-filename-extension': 'off'
          }
        })
        .addDepsFromPkg('eslint-config-airbnb');
    },
    prettier(skill: SkillWithHelpers): SkillWithHelpers {
      return skill
        .extendConfig('eslint', {
          extends: ['prettier'],
          plugins: ['prettier']
        })
        .addDepsFromPkg(['eslint-config-prettier', 'eslint-plugin-prettier']);
    }
  }
};

export default skill;
