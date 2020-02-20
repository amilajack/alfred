import { Target, Entrypoint, SkillTaskModule } from '@alfred/types';
import buildTask from '@alfred/task-build';
import startTask from '@alfred/task-start';
import testTask from '@alfred/task-test';
import formatTask from '@alfred/task-format';
import lintTask from '@alfred/task-lint';

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

export const CORE_TASKS: Array<[string, SkillTaskModule]> = [
  ['build', buildTask],
  ['start', startTask],
  ['test', testTask],
  ['lint', lintTask],
  ['format', formatTask]
];

export const ENTRYPOINTS: Array<Entrypoint> = [
  {
    project: 'app',
    platform: 'browser',
    filename: 'app.browser.js'
  },
  {
    project: 'app',
    platform: 'node',
    filename: 'app.node.js'
  },
  {
    project: 'lib',
    platform: 'node',
    filename: 'lib.node.js'
  },
  {
    project: 'lib',
    platform: 'browser',
    filename: 'lib.browser.js'
  }
];

// All the possible targets
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
