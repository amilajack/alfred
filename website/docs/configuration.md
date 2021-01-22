---
id: configuration
title: Configuration
---

## Example

```jsonc
// package.json
{
  "alfred": {
    // Extend a shared config
    "extends": "alfred-config-web-app",
    // Skills that override the default skills
    "skills": [
      "@alfred/skill-react"
    ],
    // Determine npm client (NPM or Yarn)
    "npmClient": "yarn"
  }
}
```

## Reference

### `extends`

Default: `undefined`

The name of the config that you want to extend

### `skills`

Default: `[]`

The skills that the Alfred project is using

### `npmClient`

Default: `npm`

Decide whether to install dependencies with NPM or Yarn

### `configsDir`

Default: `.`

The directory, relative to the project directory, to write config files

## Extending Alfred Configs

Alfred allows you to create reusable configs. This is useful when you want to share the same config across multiple projects.

Here is an example of how you would use a shareable config.

Suppose your Alfred project has the following config:

```jsonc
// package.json
{
  // ...
  "alfred": {
    "skills": [
      "@alfred/skill-react",
      "@alfred/skill-redux"
    ]
  }
}
```

Creating a shareable config will extract this config to an Alfred config. In this case, it makes sense to call the config `alfred-config-web-app`.

```jsonc
// alfred-config-web-app/package.json
{
  "name": "alfred-config-web-app",
  "version": "0.0.0",
  "main": "index.json"
}
```

```jsonc
// alfred-config-web-app/index.json
{
  "skills": [
    "@alfred/skill-react",
    "@alfred/skill-redux"
  ]
}
```

The original configuration now simplifies to this:

```jsonc
{
  "alfred": {
    "extends": "web-app"
  }
}
```
