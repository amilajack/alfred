---
id: interfaces
title: The Basics
---

## Interface Example

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
