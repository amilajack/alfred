import { taskResolvesSkillDefault } from '@alfred/helpers';
import { SkillTaskModule } from '@alfred/types';

const task: SkillTaskModule = {
  subcommand: 'build',
  description: 'Build, optimize, and bundle assets in your app',
  runForEachTarget: true,
  resolveSkill: taskResolvesSkillDefault(
    'build',
    require('../package.json').name
  ),
};

export default task;
