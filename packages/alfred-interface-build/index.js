// Example of a state object
// Note how the property names are singular, unlike the 'supports' config
//
// state = {
//   // Flag name and argument types
//   env: 'production'
//   // All the supported targets a `build` skill should build
//   target: 'node',
//   // Project type
//   projectType: 'lib'
// },
const { normalizeInterfacesOfSkill } = require('@alfredpkg/core');

module.exports = {
  subcommand: 'build',

  runForAllTargets: true,

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
        skill.interfaces.find(e => e.module.subcommand === 'build')
      )
      .find(sk => {
        const { supports } = sk.interfaces.find(
          e => e.module.subcommand === 'build'
        );
        if (!supports) {
          throw new Error(
            `Skill "${
              sk.name
            }" requires the "support" property, which is required by "@alfredpkg/interface-build"`
          );
        }
        return (
          supports.env.includes(interfaceState.env) &&
          supports.targets.includes(interfaceState.target) &&
          supports.projectTypes.includes(interfaceState.projectType)
        );
      });

    if (!resolvedSkill) {
      throw new Error(
        `No installed skill for the "build" subcommand could be found that works for the given development environment and target: ${JSON.stringify(
          interfaceState
        )}`
      );
    }

    return resolvedSkill;
  }
};
