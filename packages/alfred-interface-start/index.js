/* eslint no-param-reassign: off */
const { mapShortNameEnvToLongName } = require('@alfred/helpers');
const debug = require('debug')('@alfred/interface-start');

module.exports = {
  subcommand: 'start',

  description: 'Start your app and library and reload on change',

  runForAllTargets: true,

  handleFlags(flags, { interfaceState }) {
    const supportedFlags = new Set(['--production', '--development', '--test']);
    const shortNameSupportedFlags = new Set(['--prod', '--dev']);
    return flags.reduce((prev, curr) => {
      const env = curr.slice('--'.length);
      if (shortNameSupportedFlags.has(curr)) {
        interfaceState.env = mapShortNameEnvToLongName(env);
        debug(`Setting "process.env.NODE_ENV" to "${interfaceState.env}"`);
        return prev;
      }
      if (supportedFlags.has(curr)) {
        interfaceState.env = env;
        debug(`Setting "process.env.NODE_ENV" to "${interfaceState.env}"`);
        return prev;
      }
      prev.push(curr);
      return prev;
    }, []);
  },

  /**
   * Given an array of CTF nodes, return the CTF which should be used based
   * on the current environment and current target
   */
  resolveSkill(skills = [], interfaceState) {
    const resolvedSkills = skills
      .filter(skill =>
        skill.interfaces.find(e => e.module.subcommand === 'start')
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
          supports.env.includes(interfaceState.env) &&
          supports.targets.includes(interfaceState.target) &&
          supports.projectTypes.includes(interfaceState.projectType)
        );
      });

    if (!resolvedSkills.length) {
      debug(
        `No installed skill for the "start" subcommand could be found that works for the given development environment and target: ${JSON.stringify(
          interfaceState
        )}. Defaulting to core Alfred skills`
      );
      return false;
    }

    return resolvedSkills.length === 1
      ? resolvedSkills[0]
      : resolvedSkills.find(skill => skill.default === true);
  }
};
