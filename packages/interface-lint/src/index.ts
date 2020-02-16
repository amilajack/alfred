import { SkillInterfaceModule } from '@alfred/types';
import { interfaceResolvesSkillDefault } from '@alfred/helpers';

const skillInterface: SkillInterfaceModule = {
  subcommand: 'lint',
  description: 'Check for lint errors in your app',
  runForEachTarget: false,
  resolveSkill: interfaceResolvesSkillDefault(
    'lint',
    require('../package.json').name
  )
};

export default skillInterface;