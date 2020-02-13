import path from 'path';
import { SkillFileConditionArgs } from '@alfred/types';

export default {
  name: 'react',
  description: 'A JavaScript library for building user interfaces',
  supports: {
    envs: ['production', 'development', 'test'],
    targets: ['browser'],
    projects: ['app', 'lib']
  },
  files: [
    {
      src: path.join(__dirname, 'boilerplate/index.html'),
      dest: 'src/index.html',
      condition({ project }: SkillFileConditionArgs): boolean {
        return project.targets.some(target => {
          return target.platform === 'browser' && target.project === 'app';
        });
      }
    },
    {
      src: path.join(__dirname, 'boilerplate/index.js'),
      dest: 'src/app.browser.js'
    }
  ]
};
