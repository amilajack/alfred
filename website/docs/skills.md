---
id: skills
title: The Basics of Skills
sidebar_label: The Basics
---

## What is a 'Skill'?

* A 'skill' is an object that wrappers a tool (such as Webpack, ESLint, Babel, and others)
* It decides how the tool's configuration is changed so it can work with other tools
* Skills can be run by a subcommand they specify. For example, the `@alfred/skill-webpack` skill is run with the `build` subcommand it registers
* Alfred has built-in skills that can be overriden

## Adding Skills

To use a skill in your project, use the `alfred learn <skill-pkg-name>` command, where `skill-pkg-name` is the package name of the skill you want to install.

Here are a few other examples of how you might install a skill:

```bash
# Installing a skill
alfred learn @alfred/skill-lodash
# Installing multiple skills
alfred learn @alfred/skill-react @alfred/skill-redux
```

### Skills with Subcomamnds

Alfred comes with skills. Below is a table of how these skills and which subcommands and targets they support.

| Built-in Skills                              | Subcommands       | Targets  |
|----------------------------------------------|-------------------|----------|
| [`@alfred/skill-parcel`][skill-parcel]       | `start`, `build`  | app      |
| [`@alfred/skill-rollup`][skill-rollup]       | `build`           | lib      |
| [`@alfred/skill-eslint`][skill-eslint]       | `lint`            | lib      |
| [`@alfred/skill-prettier`][skill-prettier]   | `format`          | app, lib |
| [`@alfred/skill-test`][skill-jest]           | `test`            | app, lib |

Learning a skill can either replace or add subcommands to a project. For example, if you want to use webpack instead of parcel, you can run `alfred learn @alfred/skill-webpack`. Because Webpack supports the `build` and `start` subcommands, it will be used instead of parcel.

[skill-parcel]: https://github.com/amilajack/alfred/tree/master/packages/skill-parcel
[skill-rollup]: https://github.com/amilajack/alfred/tree/master/packages/skill-rollup
[skill-eslint]: https://github.com/amilajack/alfred/tree/master/packages/skill-eslint
[skill-prettier]: https://github.com/amilajack/alfred/tree/master/packages/skill-prettier
[skill-jest]: https://github.com/amilajack/alfred/tree/master/packages/skill-jest

## Using Skills

### Extending Skill Configs

```json
// package.json
{
  // ...
  "alfred": {
    "skills": [
      ["@alfred/skill-eslint", {
        "no-console": "off"
      }]
    ]
  }
}
```

### Passing Command Line Flags to Skills

The following example passes flags to eslint. The example adds a custom formatter to eslint.

```bash
alfred run lint --format pretty
```

For now, this **only works when `showConfigs` is set to `true`**.
