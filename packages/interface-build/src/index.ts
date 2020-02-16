import { interfaceResolvesSkillDefault } from '@alfred/helpers';
import { SkillInterfaceModule } from '@alfred/types';

const skillInterface: SkillInterfaceModule = {
  subcommand: 'build',
  description: 'Build, optimize, and bundle assets in your app',
  runForEachTarget: true,
  resolveSkill: interfaceResolvesSkillDefault(
    'build',
    require('../package.json').name
  )
};

export default skillInterface;
