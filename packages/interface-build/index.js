const { mapShortNameEnvToLongName } = require('@alfred/helpers');
const debug = require('debug')('@alfred/interface-build');

module.exports = {
  subcommand: 'build',

  description: 'Build, optimize, and bundle assets in your app',

  runForAllTargets: true,

  handleFlags(flags, { target }) {
    const supportedFlags = new Set(['--production', '--development', '--test']);
    const shortNameSupportedFlags = new Set(['--prod', '--dev']);
    return flags.reduce((prev, curr) => {
      const env = curr.slice('--'.length);
      if (shortNameSupportedFlags.has(curr)) {
        // eslint-disable-next-line no-param-reassign
        target.env = mapShortNameEnvToLongName(env);
        debug(`Setting "process.env.NODE_ENV" to "${target.env}"`);
        return prev;
      }
      if (supportedFlags.has(curr)) {
        // eslint-disable-next-line no-param-reassign
        target.env = env;
        debug(`Setting "process.env.NODE_ENV" to "${target.env}"`);
        return prev;
      }
      prev.push(curr);
      return prev;
    }, []);
  },

  resolveSkill(skillNodes = [], target) {
    const resolvedSkills = skillNodes
      .filter(skillNode =>
        skillNode.interfaces.find(
          skillInterface => skillInterface.module.subcommand === 'build'
        )
      )
      .filter(skillNode => {
        const { supports } = skillNode.interfaces.find(
          e => e.module.subcommand === 'build'
        ).config;
        if (!supports) {
          throw new Error(
            `Skill "${skillNode.name}" requires the "support" property, which is required by "@alfred/interface-build"`
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
        `No installed skill for the "build" subcommand could be found that works for the given development environment and target: ${JSON.stringify(
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
