module.exports = {
  subcommand: 'build',
  flags: {
    // Flag name and argument types
    env: ['production', 'development', 'test'],
    // All the supported targets a `build` skill should build
    targets: ['browser', 'node', 'electron', 'react-native'],
    // Project type
    types: ['lib', 'app']
  }
};
