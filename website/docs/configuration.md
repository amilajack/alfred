---
id: configuration
title: Configuration
---

## Example

```json
// package.json
{
  "alfred": {
    // Extend a shared config
    "extends": "alfred-config-web-app",
    // Skills that override the default skills
    "skills": [
      "@alfred/skill-react"
    ],
    // Determine to install with NPM or Yarn
    "npmClient": "yarn"
  }
}
```

## Reference

### `extends`

Default: `undefined`

The name of the config which you want to extend

### `skills`

Default: `[]`

The skills that the Alfred project is using

### `npmClient`

Default: `npm`

Determine to install dependencies with NPM or Yarn

### `configsDir`

Default: `.`

The directory, relative to the project directory, which config files should be written to

## Extending Alfred Configs

Alfred allows you to create reusable configs. This is useful when you want to share the same config across multiple projects.

Here is an example of how you would ues a sharable config.

Suppose your Alfred project has the following config:

```json
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

This config can be extracted to an Alfred config by creating a sharable config. In this case, it makes sense to call the config `alfred-config-web-app`.

```json
// alfred-config-web-app/package.json
{
  "name": "alfred-config-web-app",
  "version": "0.0.0",
  "main": "index.json"
}
```

```json
// alfred-config-web-app/index.json
{
  "skills": [
    "@alfred/skill-react",
    "@alfred/skill-redux"
  ]
}
```

The original configuration now simplifies to this:

```json
{
  "alfred": {
    "extends": "web-app"
  }
}
```
