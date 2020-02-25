---
id: tasks
title: Tasks
---

Tasks are what define which [skill](skills) should be used when a specific subcommand is called. For example, when `alfred run build` is called, Alfred needs to decide which skill to run `build` with (either `@alfred/skill-rollup`, `@alfred/skill-parcel`, or `@alfred/skill-webpack`).

### Skill with Tasks

This is an example of a [skill](skills) for parcel which supports both the `build` and `start` subcommands:

```js
const skill = {
  name: 'parcel',
  tasks: [
    '@alfred/task-build',
    '@alfred/task-start'
  ],
  // ...
};
```

### Skill with Tasks and Configs

[Skills](skills) can support different platforms and projects. When adding a task to a skill, the task config takes an optional `supports` property, which is an object containing the projectss, platforms, and environments the skill supports for th given task.

```js
const supports = {
  envs: ['production', 'development', 'test'],
  platforms: ['browser', 'node'],
  projects: ['app']
};

const skill = {
  name: 'parcel',
  tasks: [
    ['@alfred/task-build', { supports }],
    ['@alfred/task-start', { supports }]
  ],
  // ...
};
```

If `supports` is not passed, Alfred will assume the task supports all platforms, projects, and environments.

### Running once for each target

Certain tasks need to be run once for each [target](migrating-to-alfred#targets). One example of this is the `@alfred/task-build` task, which need to build each [target](migrating-to-alfred#targets) it supports. The `@alfred/task-lint` task only needs to be run once for all targets.

```js
// Running once for each target
module.exports = {
  subcommand: 'build',
  description: 'Build, optimize, and bundle assets in your app',
  runForEachTarget: true,
  resolveSkill(skills, target) {
    // ...
  }
};

```

```js
// Running once for all targets
module.exports = {
  subcommand: 'lint',
  description: 'Lint your app',
  runForEachTarget: false,
  resolveSkill(skills) {
    // ...
  }
};
```

### Resolving a Skill

`resolveSkill` takes an array of [Skills](skills) and returns the skill to be resolved. If `runForEachTarget` is true, a target paramater is passed to `resolveSkill`.
