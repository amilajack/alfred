/* eslint no-param-reassign: off */
// Example of a interfaceState object
// Note how the property names are singular, unlike the 'supports' config
//
// interfaceState = {
//   // Flag name and argument types
//   env: 'production'
//   // All the supported targets a `build` skill should build
//   target: 'node',
//   // Project type
//   projectType: 'lib'
// },
const {
  normalizeInterfacesOfSkill,
  mapShortNameEnvToLongName
} = require('@alfred/core');
const debug = require('debug')('@alfred/interface-build');

module.exports = {
  subcommand: 'build',

  description: 'Build, optimize, and bundle assets in your app',

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
      .map(skill => ({
        ...skill,
        interfaces: normalizeInterfacesOfSkill(skill.interfaces)
      }))
      .filter(skill =>
        skill.interfaces.find(e => e.module.subcommand === 'build')
      )
      .filter(sk => {
        const { supports } = sk.interfaces.find(
          e => e.module.subcommand === 'build'
        ).config;
        if (!supports) {
          throw new Error(
            `Skill "${sk.name}" requires the "support" property, which is required by "@alfred/interface-build"`
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
        `No installed skill for the "build" subcommand could be found that works for the given development environment and target: ${JSON.stringify(
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
