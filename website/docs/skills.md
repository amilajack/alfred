---
id: skills
title: Skills
---

## What is a 'Skill'?

* A 'skill' is an object that wrappers a tool such as Webpack, ESLint, Babel, and others
* It decides how the tool's configuration is changed so it can work with other tools
* Skills can be run by a subcommand they specify. For example, the `@alfred/skill-webpack` skill is run with the `build` subcommand it registers
* Alfred has default skills that can be overriden

## Adding Skills

To use a skill in your project, use the `alfred learn <skill-pkg-name>` command, where `skill-pkg-name` is the package name of the skill you want to install.

Here are a few examples of learning a skill:

```bash
# Installing a skill
alfred learn @alfred/skill-lodash
# Installing multiple skills
alfred learn @alfred/skill-react @alfred/skill-redux
```

### Skills with Subcommands

Alfred comes with default skills. Below is a table of how these skills and which subcommands and targets they support.

| Default Skills                               | Subcommands       | Targets  |
|----------------------------------------------|-------------------|----------|
| [`@alfred/skill-parcel`][skill-parcel]       | `start`, `build`  | app      |
| [`@alfred/skill-rollup`][skill-rollup]       | `build`           | lib      |
| [`@alfred/skill-eslint`][skill-eslint]       | `lint`            | lib      |
| [`@alfred/skill-prettier`][skill-prettier]   | `format`          | app, lib |
| [`@alfred/skill-test`][skill-jest]           | `test`            | app, lib |

Learning a skill can either replace or add subcommands to a project. For example, if you want to use webpack instead of parcel, you can run `alfred learn @alfred/skill-webpack`. Since both webpack and parcel support the `build` and `start` subcommands and parcel is a default skill, webpack will override parcel. Future calls to `alfred run build` and `alfred run start` will now use webpack instead of parcel.

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
        "extends": "airbnb",
        "rules": {
          "no-console": "off"
        }
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
