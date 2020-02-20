import { SkillTaskModule } from '@alfred/types';
import { taskResolvesSkillDefault } from '@alfred/helpers';

const tasks: SkillTaskModule = {
  subcommand: 'format',
  description: 'Format the source code of your app',
  runForEachTarget: false,
  resolveSkill: taskResolvesSkillDefault(
    'format',
    require('../package.json').name
  )
};

export default tasks;
