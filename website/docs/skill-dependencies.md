---
id: skill-dependencies
title: Dependencies
---

`peerDependencies` are specified in the `package.json` of a skill. They are not `dependencies` because by determining dependencies in skills, they can be extended. Users can write their own skills to customize which dependencies they want installed. Customizing dependencies, however, should be considered an antipattern because they use versions of a dependency that may not be supported by a skill.

```json
// package.json
{
  "name": "@alfred/skill-parcel",
  "peerDependencies": {
    "react": "^16.0.0"
  }
}
```
