import { InterfaceState } from '@alfred/types';

export const PKG_SORT_ORDER = [
  'name',
  'version',
  'private',
  'description',
  'keywords',
  'homepage',
  'bugs',
  'repository',
  'license',
  'author',
  'contributors',
  'files',
  'sideEffects',
  'main',
  'module',
  'jsnext:main',
  'browser',
  'types',
  'typings',
  'style',
  'example',
  'examplestyle',
  'assets',
  'bin',
  'man',
  'directories',
  'workspaces',
  'scripts',
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'bundledDependencies',
  'bundleDependencies',
  'optionalDependencies',
  'resolutions',
  'engines',
  'engineStrict',
  'os',
  'cpu',
  'preferGlobal',
  'publishConfig',
  'betterScripts',
  'husky',
  'pre-commit',
  'commitlint',
  'lint-staged',
  'config',
  'nodemonConfig',
  'browserify',
  'babel',
  'browserslist',
  'xo',
  'prettier',
  'eslintConfig',
  'eslintIgnore',
  'stylelint',
  'jest',
  '...rest'
];

/* eslint import/prefer-default-export: off */
// Examples
// 'lib.node.js',
// 'app.node.js',
// 'lib.browser.js',
// 'app.browser.js'
// etc...
export const ENTRYPOINTS = [
  'lib.node.js',
  'app.node.js',
  'lib.browser.js',
  'app.browser.js'
];

// All the possible interface states
// @TODO Also allow .ts entrypoints
// @TODO Allow the follow entrypoints:
// 'lib.electron.main.js',
// 'lib.electron.renderer.js',
// 'app.electron.main.js',
// 'app.electron.renderer.js',
// 'lib.react-native.js',
// 'app.react-native.js'
export const INTERFACE_STATES: Array<InterfaceState> = [
  {
    projectType: 'app',
    target: 'browser',
    env: 'production'
  },
  {
    projectType: 'app',
    target: 'browser',
    env: 'development'
  },
  // @TODO
  // {
  //   projectType: 'app',
  //   target: 'node',
  //   env: 'production'
  // },
  // @TODO
  // {
  //   projectType: 'app',
  //   target: 'node',
  //   env: 'development'
  // },
  {
    projectType: 'lib',
    target: 'node',
    env: 'production'
  },
  {
    projectType: 'lib',
    target: 'node',
    env: 'development'
  },
  {
    projectType: 'lib',
    target: 'browser',
    env: 'production'
  },
  {
    projectType: 'lib',
    target: 'browser',
    env: 'development'
  }
];
