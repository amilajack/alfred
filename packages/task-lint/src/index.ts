import { SkillTaskModule } from '@alfred/types';
import { taskResolvesSkillDefault } from '@alfred/helpers';

const task: SkillTaskModule = {
  subcommand: 'lint',
  description: 'Check for lint errors in your app',
  runForEachTarget: false,
  resolveSkill: taskResolvesSkillDefault(
    'lint',
    require('../package.json').name
  ),
};

export default task;
