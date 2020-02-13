import path from 'path';
import { execCmdInProject, getPkgBinPath } from '@alfred/helpers';
import { HookArgs, SkillConfig, RawSkill } from '@alfred/types';

const skill: RawSkill = {
  name: 'prettier',
  description: 'Format the source files in your project',
  interfaces: ['@alfred/interface-format'],
  configs: [
    {
      alias: 'prettier',
      filename: '.prettierrc',
      fileType: 'json',
      config: {
        singleQuote: true
      }
    }
  ],
  hooks: {
    async run({ project, skill, config, event }: HookArgs): Promise<void> {
      const binPath = await getPkgBinPath(project, 'prettier');
      const { filename } = skill.configs.get('prettier') as SkillConfig;
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
          config.showConfigs ? `--config ${configPath}` : ''
        ].join(' ')
      );
    }
  },
  transforms: {}
};

export default skill;
