import path from 'path';
import {
  SkillFileConditionArgs,
  RawSkill,
  Env,
  Platform,
  ProjectEnum
} from '@alfred/types';

const supports = {
  envs: ['production', 'development', 'test'] as Env[],
  platforms: ['browser'] as Platform[],
  projects: ['app', 'lib'] as ProjectEnum[]
};

const skill: RawSkill = {
  name: 'react',
  description: 'A JavaScript library for building user interfaces',
  supports,
  files: [
    {
      src: require.resolve('../boilerplate/app.browser.js'),
      dest: 'src/app.browser.js',
      condition: ({ project }): boolean => {
        return project.targets.some(target => {
          return target.platform === 'browser' && target.project === 'app';
        });
      }
    },
    {
      src: path.join(__dirname, '../boilerplate/index.html'),
      dest: 'src/index.html',
      condition({ project }: SkillFileConditionArgs): boolean {
        return project.targets.some(target => {
          return target.platform === 'browser' && target.project === 'app';
        });
      }
    },
    {
      src: require.resolve('../boilerplate/lib.browser.js'),
      dest: 'src/lib.browser.js',
      condition: ({ project }): boolean => {
        return project.targets.some(target => {
          return target.platform === 'browser' && target.project === 'lib';
        });
      }
    }
  ]
};

export default skill;
