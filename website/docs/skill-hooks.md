---
id: skill-hooks
title: Hooks
---

To give skill authors more control, Alfred allows skills to run code before and after important events.

## Adding Hooks to a Skill

You can add hooks to a skill by simply adding them to the `hooks` property:

```js
const reduxSkill = {
  name: 'redux',
  hooks: {
    beforeRun(hookArgs) {
      const { project, config, targets, skill, ...others } = hookArgs;
      // perform some checks...
    }
  },
  // ...
};

export default reduxSkill;
```

## Available Hooks

The following are all the hooks that are supported at the moment:

* `beforeRun`
* `run`
* `afterRun`
* `beforeLearn`
* `afterLearn`
* `beforeTransforms`
* `afterTransforms`
