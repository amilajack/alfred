---
id: migrating-to-alfred
title: Migrating to Alfred
---

Migrate to Alfred by following the steps below.

### Directory Structure

Make sure that you have a `src` directory in the root of your project.

### Entrypoints

Make sure you create the necessary entrypoints in your `./src` directory. Entrypoints follow the following format: `{projectType}.{platform}.js`. Here are some examples of entrypoints: `app.browser.js`, `lib.node.js`, etc.

### Tests

Move all your tests to `tests` directory in the root of your project.

### Targets

Alfred will output your builds to a `targets` directory in the root of your project. Please adapt your project to take these changes into account.

### NPM Scripts

Add the following standard Alfred NPM scripts to your `package.json`:

```json
"scripts": {
  "build": "alfred run build",
  "format": "alfred run format",
  "lint": "alfred run lint",
  "start": "alfred run start",
  "test": "alfred run test"
}
```
