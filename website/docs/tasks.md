---
id: tasks
title: The Basics of Tasks
sidebar_label: The Basics
---

## Example

### Running once for each target

```js
module.exports = {
  subcommand: 'build',
  description: 'Build, optimize, and bundle assets in your app',
  runForEachTarget: true,
  resolveSkill: (skills, target) => {
    // ...
  }
};
```

### Running once for all targets

```js
module.exports = {
  subcommand: 'lint',
  description: 'Lint your app',
  runForEachTarget: false,
  resolveSkill: (skills) => {
    // ...
  }
};
```
