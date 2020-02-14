import { SkillInterfaceModule } from '@alfred/types';
import { interfaceResolvesSkillDefault } from '@alfred/helpers';

const skillInterface: SkillInterfaceModule = {
  subcommand: 'format',
  description: 'Format the source code of your app',
  resolveSkill: interfaceResolvesSkillDefault(
    'format',
    require('../package.json').name
  )
};

export default skillInterface;
