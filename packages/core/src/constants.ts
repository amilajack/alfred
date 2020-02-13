import { Target, Entrypoint } from '@alfred/types';

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
export const RAW_ENTRYPOINTS = [
  'lib.node.js',
  'app.node.js',
  'lib.browser.js',
  'app.browser.js'
];

export const ENTRYPOINTS: Array<Entrypoint> = [
  {
    project: 'app',
    platform: 'browser'
  },
  {
    project: 'app',
    platform: 'node'
  },
  {
    project: 'lib',
    platform: 'node'
  },
  {
    project: 'lib',
    platform: 'browser'
  }
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
export const TARGETS: Array<Target> = [
  {
    project: 'app',
    platform: 'browser',
    env: 'production'
  },
  {
    project: 'app',
    platform: 'browser',
    env: 'development'
  },
  {
    project: 'app',
    platform: 'node',
    env: 'production'
  },
  {
    project: 'app',
    platform: 'node',
    env: 'development'
  },
  {
    project: 'lib',
    platform: 'node',
    env: 'production'
  },
  {
    project: 'lib',
    platform: 'node',
    env: 'development'
  },
  {
    project: 'lib',
    platform: 'browser',
    env: 'production'
  },
  {
    project: 'lib',
    platform: 'browser',
    env: 'development'
  }
];
