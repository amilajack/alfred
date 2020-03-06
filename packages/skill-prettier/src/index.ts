import path from 'path';
import { execCmdInProject, getPkgBinPath } from '@alfred/helpers';
import { SkillConfig, RawSkill } from '@alfred/types';

const skill: RawSkill = {
  name: 'prettier',
  description: 'Format the source files in your project',
  tasks: ['@alfred/task-format'],
  default: true,
  configs: [
    {
      alias: 'prettier',
      filename: '.prettierrc',
      pkgProperty: 'prettier',
      fileType: 'json',
      config: {
        singleQuote: true
      }
    }
  ],
  hooks: {
    async run({ project, skill, config, event }): Promise<void> {
      const binPath = await getPkgBinPath(project, 'prettier');
      const { filename, write } = skill.configs.get('prettier') as SkillConfig;
      const configPath = path.join(config.configsDir, filename);
      execCmdInProject(
        project,
        [
          binPath,
          '--ignore-path',
          '.gitignore',
          '--single-quote',
          '--write',
          '**/*.js',
          ...(event.flags || []),
          write === 'file' ? `--config ${configPath}` : ''
        ].join(' ')
      );
    }
  },
  transforms: {}
};

export default skill;
