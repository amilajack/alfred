/* eslint no-param-reassign: off */
import {
  mapShortNameEnvToLongName,
  interfaceResolvesSkillDefault
} from '@alfred/helpers';
import { SkillInterfaceModule, Env } from '@alfred/types';
const debug = require('debug')('@alfred/interface-start');

const skillInterface: SkillInterfaceModule = {
  subcommand: 'test',
  description: 'Test your app and library',
  runForEachTarget: false,
  handleFlags(flags: string[], { target }): string[] {
    const supportedFlags = new Set(['--production', '--development', '--test']);
    const shortNameSupportedFlags = new Set(['--prod', '--dev']);
    return flags.reduce((prev: string[], curr: string) => {
      const env = curr.slice('--'.length) as Env;
      if (shortNameSupportedFlags.has(curr)) {
        target.env = mapShortNameEnvToLongName(env);
        debug(`Setting "process.env.NODE_ENV" to "${target.env}"`);
        return prev;
      }
      if (supportedFlags.has(curr)) {
        target.env = env;
        debug(`Setting "process.env.NODE_ENV" to "${target.env}"`);
        return prev;
      }
      prev.push(curr);
      return prev;
    }, []);
  },
  resolveSkill: interfaceResolvesSkillDefault(
    'test',
    require('../package.json').name
  )
};

export default skillInterface;
