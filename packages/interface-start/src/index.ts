/* eslint no-param-reassign: off */
import { mapShortNameEnvToLongName } from '@alfred/helpers';
import {
  SkillWithHelpers,
  Target,
  SkillInterfaceModule,
  Env
} from '@alfred/types';
const debug = require('debug')('@alfred/interface-start');

const skillInterface: SkillInterfaceModule = {
  subcommand: 'start',

  description: 'Start your app and library and reload on change',

  runForAllTargets: true,

  handleFlags(flags: string[], { target }): string[] {
    const supportedFlags = new Set(['--production', '--development', '--test']);
    const shortNameSupportedFlags = new Set(['--prod', '--dev']);
    return flags.reduce((prev, curr) => {
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

  resolveSkill(
    skills: SkillWithHelpers[] = [],
    target: Target
  ): SkillWithHelpers | false {
    const resolvedSkills = skills
      .filter(skill =>
        skill.interfaces.find(
          skillInterface => skillInterface.module.subcommand === 'start'
        )
      )
      .filter(skill => {
        const skillInterface = skill.interfaces.find(
          skillInterface => skillInterface.module.subcommand === 'start'
        );
        if (!skillInterface) {
          throw new Error(
            'No interfcace could be found with "start" subcommand'
          );
        }
        const { supports } = skill;
        return (
          supports.envs.includes(target.env) &&
          supports.platforms.includes(target.platform) &&
          supports.projects.includes(target.project)
        );
      });

    if (!resolvedSkills.length) {
      debug(
        `No installed skill for the "start" subcommand could be found that works for the given development environment and target: ${JSON.stringify(
          target
        )}. Defaulting to core Alfred skills`
      );
      return false;
    }

    const defaultSkill = resolvedSkills.find(skill => skill.default === true);

    if (!defaultSkill) {
      throw new Error('Cannot find a default skill');
    }

    return resolvedSkills.length === 1 ? resolvedSkills[0] : defaultSkill;
  }
};

export default skillInterface;
