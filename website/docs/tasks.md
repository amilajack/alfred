---
id: tasks
title: The Basics
---

## Example

```js
// index.js
export default {
  subcommand: 'build',
  flags: {
    // Flag name and argument types
    envs: ['production', 'development', 'test']
  }
};
```
