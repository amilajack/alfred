import path from 'path';
import { getPkgBinPath, execCmdInProject } from '@alfred/helpers';
import {
  RawSkill,
  Skill,
  TransformArgs,
  SkillConfig,
  HookArgs,
  RunEvent
} from '@alfred/types';

const skill: RawSkill = {
  name: 'eslint',
  description: 'Lint all your JS files',
  tasks: ['@alfred/task-lint'],
  default: true,
  configs: [
    {
      alias: 'eslint',
      filename: '.eslintrc.js',
      pkgProperty: 'eslintConfig',
      config: {
        root: true,
        env: {
          browser: true,
          node: true
        },
        extends: ['bliss']
      }
    }
  ],
  hooks: {
    async run({
      project,
      skill,
      config,
      event
    }: HookArgs<RunEvent>): Promise<void> {
      const { flags } = event;
      const configPath = path.join(
        config.configsDir,
        skill.configs.get('eslint')?.filename as string
      );
      const binPath = await getPkgBinPath(project, 'eslint');
      execCmdInProject(
        project,
        [
          binPath,
          skill.configs.get('eslint')?.write === 'file'
            ? `--config ${configPath}`
            : '',
          'src tests',
          ...flags
        ].join(' ')
      );
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
    babel(skill: Skill): Skill {
      return skill
        .extendConfig('eslint', {
          parser: 'babel-eslint'
        })
        .addDepsFromPkg('babel-eslint');
    },
    jest(skill: Skill): Skill {
      return skill.addDepsFromPkg('eslint-plugin-jest').extendConfig('eslint', {
        plugins: ['jest']
      });
    },
    mocha(skill: Skill): Skill {
      return skill
        .extendConfig('eslint', {
          plugins: ['mocha']
        })
        .addDepsFromPkg('eslint-plugin-mocha');
    },
    webpack(skill: Skill, { toSkill, project, config }: TransformArgs): Skill {
      return skill
        .extendConfig('eslint', {
          settings: {
            'import/resolver': {
              webpack: {
                config: path.join(
                  project.root,
                  config.configsDir,
                  toSkill.configs.get('webpack.base')?.filename as string
                )
              }
            }
          }
        })
        .addDepsFromPkg('eslint-import-resolver-webpack');
    },
    react(skill: Skill): Skill {
      return skill
        .extendConfig('eslint', {
          extends: ['airbnb'],
          rules: {
            'react/jsx-filename-extension': 'off'
          }
        })
        .addDepsFromPkg('eslint-config-airbnb');
    },
    prettier(skill: Skill): Skill {
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
