/* eslint no-param-reassign: off */
const {
  normalizeInterfacesOfSkill,
  mapShortNameEnvToLongName
} = require('@alfredpkg/core');
const debug = require('debug')('@alfredpkg/interface-start');

const name = 'My App';

// fake app

debug('booting %o', name);

module.exports = {
  subcommand: 'start',

  description: 'Start your app and library and reload on change',

  runForAllTargets: true,

  handleFlags(flags, interfaceState) {
    const supportedFlags = new Set(['--production', '--development', '--test']);
    const shortNameSupportedFlags = new Set(['--prod', '--dev']);
    return flags.reduce((prev, curr) => {
      const env = curr.slice('--'.length);
      if (shortNameSupportedFlags.has(curr)) {
        interfaceState.env = mapShortNameEnvToLongName(env);
        console.log(
          `Setting "process.env.NODE_ENV" to "${interfaceState.env}"`
        );
        return prev;
      }
      if (supportedFlags.has(curr)) {
        interfaceState.env = env;
        console.log(
          `Setting "process.env.NODE_ENV" to "${interfaceState.env}"`
        );
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
    const resolvedSkill = skills
      .map(skill => ({
        ...skill,
        interfaces: normalizeInterfacesOfSkill(skill.interfaces)
      }))
      .filter(skill =>
        skill.interfaces.find(e => e.module.subcommand === 'start')
      )
      .find(sk => {
        const { supports } = sk.interfaces.find(
          e => e.module.subcommand === 'start'
        ).config;
        if (!supports) {
          throw new Error(
            `Skill "${
              sk.name
            }" requires the "support" property, which is required by "@alfredpkg/interface-start".`
          );
        }
        return (
          supports.env.includes(interfaceState.env) &&
          supports.targets.includes(interfaceState.target) &&
          supports.projectTypes.includes(interfaceState.projectType)
        );
      });

    if (!resolvedSkill) {
      debug(
        `No installed skill for the "start" subcommand could be found that works for the given development environment and target: ${JSON.stringify(
          interfaceState
        )}. Defaulting to core Alfred skills`
      );
      return false;
    }

    return resolvedSkill;
  }
};
