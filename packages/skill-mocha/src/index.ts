import fs from 'fs';
import path from 'path';
import { execCmdInProject, getPkgBinPath } from '@alfred/helpers';
import {
  SkillConfig,
  RawSkill,
  Env,
  Platform,
  ProjectEnum
} from '@alfred/types';

const supports = {
  envs: ['production', 'development', 'test'] as Env[],
  platforms: ['node'] as Platform[],
  projects: ['app', 'lib'] as ProjectEnum[]
};

const skill: RawSkill = {
  name: 'mocha',
  supports,
  tasks: [
    [
      '@alfred/task-test',
      {
        supports
      }
    ]
  ],
  hooks: {
    async run({ project, config, skillMap, event }): Promise<void> {
      const binPath = await getPkgBinPath(project, 'mocha');
      const mochaBabelRegisterPath = path.join(
        project.root,
        config.configsDir,
        'mocha.js'
      );
      const { config: babelConfig } = skillMap
        .get('babel')
        ?.configs.get('babel') as SkillConfig;
      await fs.promises.writeFile(
        mochaBabelRegisterPath,
        `const babelRegister = require('@babel/register');
        require("@babel/register")(${JSON.stringify(babelConfig)});`
      );
      execCmdInProject(
        project,
        [
          binPath,
          `--require ${mochaBabelRegisterPath} tests`,
          ...event.flags
        ].join(' ')
      );
    }
  }
};

export default skill;
