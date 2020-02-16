/* eslint no-param-reassign: off */
import {
  mapShortNameEnvToLongName,
  interfaceResolvesSkillDefault
} from '@alfred/helpers';
import { SkillInterfaceModule, Env } from '@alfred/types';

const skillInterface: SkillInterfaceModule = {
  subcommand: 'start',
  description: 'Start your app and library and reload on change',
  runForEachTarget: true,
  handleFlags(flags: string[], { target }): string[] {
    const supportedFlags = new Set(['--production', '--development', '--test']);
    const shortNameSupportedFlags = new Set(['--prod', '--dev']);
    return flags.reduce((prev: string[], curr: string) => {
      const env = curr.slice('--'.length) as Env;
      if (shortNameSupportedFlags.has(curr)) {
        target.env = mapShortNameEnvToLongName(env);
        return prev;
      }
      if (supportedFlags.has(curr)) {
        target.env = env;
        return prev;
      }
      prev.push(curr);
      return prev;
    }, []);
  },
  resolveSkill: interfaceResolvesSkillDefault(
    'start',
    require('../package.json').name
  )
};

export default skillInterface;
