import path from 'path';
import { execBinInProject } from '@alfred/helpers';
import { SkillConfig, RawSkill } from '@alfred/types';

const skill: RawSkill = {
  name: 'prettier',
  tasks: ['@alfred/task-format'],
  default: true,
  configs: [
    {
      alias: 'prettier',
      filename: '.prettierrc',
      pkgProperty: 'prettier',
      fileType: 'json',
      config: {
        singleQuote: true,
        trailingComma: 'none',
      },
    },
  ],
  hooks: {
    async run({ project, skill, config, event }): Promise<void> {
      const { filename, write } = skill.configs.get('prettier') as SkillConfig;
      const configPath = path.join(config.configsDir, filename);
      execBinInProject(project, [
        'prettier',
        '--ignore-path',
        '.gitignore',
        '--single-quote',
        '--write',
        '**/*.js',
        ...(event.flags || []),
        write === 'file' ? `--config ${configPath}` : '',
      ]);
    },
  },
  transforms: {},
};

export default skill;
