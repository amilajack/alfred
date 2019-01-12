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

module.exports = {
  subcommand: 'build',

  runForAllTargets: true,

  /**
   * Given an array of CTF nodes, return the CTF which should be used based
   * on the current environment and current target
   */
  resolveSkill(skills = [], state) {
    const skill = skills
      .filter(sk => sk.interface === '@alfredpkg/interface-build')
      .find(sk => {
        if (!sk.interfaceConfig) {
          throw new Error(
            `Skill "${
              sk.name
            }" does not have an interface config, which is required by alfred-interface-build`
          );
        }
        const { supports } = sk.interfaceConfig;
        return (
          supports.env.includes(state.env) &&
          supports.targets.includes(state.target) &&
          supports.projectTypes.includes(state.projectType)
        );
      });

    if (!skill) {
      throw new Error(
        `No installed skill could be found that works for the given state: ${JSON.stringify(
          state
        )}`
      );
    }

    return skill;
  }
};
