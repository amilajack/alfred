import {
  CORE_SKILL,
  Target,
  Entrypoint,
  SkillInterfaceModule,
  Skill
} from '@alfred/types';
import buildInterface from '@alfred/interface-build';
import startInterface from '@alfred/interface-start';
import testInterface from '@alfred/interface-test';
import formatInterface from '@alfred/interface-format';
import lintInterface from '@alfred/interface-lint';
import { requireSkill } from './skill';

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

export const CORE_SKILLS: { [skill in CORE_SKILL]: Skill } = {
  webpack: requireSkill('@alfred/skill-webpack'),
  babel: requireSkill('@alfred/skill-babel'),
  parcel: requireSkill('@alfred/skill-parcel'),
  eslint: requireSkill('@alfred/skill-eslint'),
  prettier: requireSkill('@alfred/skill-prettier'),
  jest: requireSkill('@alfred/skill-jest'),
  react: requireSkill('@alfred/skill-react'),
  rollup: requireSkill('@alfred/skill-rollup'),
  lodash: requireSkill('@alfred/skill-lodash')
};

export const CORE_INTERFACES: Array<[string, SkillInterfaceModule]> = [
  ['build', buildInterface],
  ['start', startInterface],
  ['test', testInterface],
  ['lint', lintInterface],
  ['format', formatInterface]
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
