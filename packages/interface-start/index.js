/* eslint no-param-reassign: off */
const { mapShortNameEnvToLongName } = require('@alfred/helpers');
const debug = require('debug')('@alfred/interface-start');

module.exports = {
  subcommand: 'start',

  description: 'Start your app and library and reload on change',

  runForAllTargets: true,

  handleFlags(flags, { target }) {
    const supportedFlags = new Set(['--production', '--development', '--test']);
    const shortNameSupportedFlags = new Set(['--prod', '--dev']);
    return flags.reduce((prev, curr) => {
      const env = curr.slice('--'.length);
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

  resolveSkill(skills = [], target) {
    const resolvedSkills = skills
      .filter(skill =>
        skill.interfaces.find(
          skillInterface => skillInterface.module.subcommand === 'start'
        )
      )
      .filter(sk => {
        const { supports } = sk.interfaces.find(
          e => e.module.subcommand === 'start'
        ).config;
        if (!supports) {
          throw new Error(
            `Skill "${sk.name}" requires the "support" property, which is required by "@alfred/interface-start".`
          );
        }
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

    return resolvedSkills.length === 1
      ? resolvedSkills[0]
      : resolvedSkills.find(skill => skill.default === true);
  }
};
