---
id: getting-started
title: Getting Started
sidebar_label: Getting Started
---

## Installing

```bash
# NPM
npm install --global @alfred/cli
# Yarn
yarn global add @alfred/cli

alfred new my-new-project
cd my-new-project
```

## Skills

```bash
alfred start
alfred build
alfred format
alfred test
alfred migrate
```

## Learning Skills

```bash
# Learning skills
alfred learn @alfred/skill-parcel
# Build using the new subcommand
alfred build
# Learning multiple skills
alfred learn @alfred/skill-angular @alfred/skill-redux
```

## Alfred Skill Example

The following is an example of an Alfred skill (Config Transformer Function) for babel

```js
// index.js
export default {
  // The name that other skills will refer to this skill by
  name: 'babel',
  // The (optional) interface that this skill will implement. A skill uses an interface
  // when it is able to replace an existing subcommand. For example, both the
  // @alfred/skill-parcel and @alfred/skill-webpack skills, which both register a 'build'
  // subcommand, will both implement @alfred/interface-build. Implementing it will require
  // them to adhere to a shared set of calling conventions such as flags, subcommands, etc. In
  // the case of babel, no interface will be implemented because babel will not be invoked directly
  // as a subcommand. A bundler will always call babel.
  interfaces: [],
  // ⚠️  Deprecated ️️⚠️
  devDependencies: {
    '@babel/cli': '7.2.0',
    '@babel/core': '7.2.0',
    '@babel/preset': 'env@7.2.0'
  },
  description: 'Transpile JS from ESNext to the latest ES version',
  // An array of the configs introduced by the skill
  configFiles: [
    {
      // The name of the config. This should never include a filename extension because skills
      // have the ability to change extensions (ex. .js -> .ts) so this should not be fixed
      name: 'babelrc',
      // The filename and the path which the config should be written to
      path: '.babelrc.js',
      // The value of the config. Can be an object or a string
      config: {
        presets: ['@babel/preset-env']
      }
    }
  ],
  ctfs: {
    webpack: (webpackCtf: CtfNode): CtfNode => {
      return webpackCtf
        .extendConfig('webpack.base', {
          module: {
            devtool: 'source-map',
            mode: 'production',
            target: 'electron-main',
            entry: './app/main.dev',
            output: {
              path: 'app',
              filename: './app/main.prod.js'
            }
          }
        })
        .addDevDependencies({ 'babel-loader': '10.0.0' });
    },
    eslint: (eslintCtf: CtfNode): CtfNode => {
      return eslintCtf
        .extendConfig('eslint', {
          'parser': 'babel-eslint'
        })
        .addDevDependencies({ 'babel-eslint': '10.0.0' });
    }
  }
};
```

`peerDependencies` are specified in the `package.json` of a skill. They are not `dependencies` because by determining dependencies in CTFs, they can be extended. Users can write their own CTFs to customize which dependencies they want installed. Customizing dependencies, however, should be considered an antipattern because they use versions of a dependency that may not be supported by a skill.

```jsonc
// package.json
{
  "name": "@alfred/skill-parcel",
  "peerDependencies": {
    "react": "0.15.0"
  }
}
```

## Passing Flags to Skills

The following example passes flags to eslint. The example adds a custom formatter to eslint.

```bash
alfred lint --format pretty
```

For now, this **only works when `showConfigs` is set to `true`**.

## Interface Example

```js
// index.js
export default {
  subcommand: 'build',
  flags: {
    // Flag name and argument types
    env: ['production', 'development', 'test']
  }
};

type AlfredInterface = {
  subcommand: string,
  flags: {
    [x: string]: Array<string>
  }
};
```

## Alfred Config Example

```jsonc
// package.json
{
  "alfred": {
    // Skills that override the default skills
    "skills": [
      "@alfred/skill-parcel",
      "@alfred/skill-testcafe"
    ],
    // Determine to install with NPM or Yarn (defaults to NPM)
    "npmClient": "yarn",
    // Write the configs to a './.configs' directory
    "showConfigs": true,
    // Config for all app targets
    "app": {
      // Each target will have it's own build
      "targets": {
        "chrome": 50,
        "node": 10
      }
    },
    // Config for all lib targets
    "lib": {
      "recommendSkills": ["@alfred/skill-react"]
    },
    // Config only applied to browser libs
    "browser": {
      "lib": {
        // ...
      }
    }
  }
}
```

## Extending Alfred Configs

Suppose you have the following Alfred config:

```jsonc
// package.json
{
  // ...
  "alfred": {
    "skills": [
      "@alfred/skill-parcel",
      ["@alfred/skill-babel", {
        // Config for Babel
        "presets": [
          "@babel-preset-env",
          "@babel-preset-flow",
          "@babel-preset-react"
        ],
        "plugins": [
          "@babel/plugin-proposal-class-properties"
        ]
      }],
      ["@alfred/skill-eslint", {
        // Config for ESLint
        "rules": {
          "no-console": "off"
        }
      }]
    ]
  }
}
```

This config can be extracted to an Alfred config like so:

```jsonc
// alfred-config-my-app/package.json
{
  "name": "alfred-config-my-app",
  "version": "0.0.0",
  "main": "index.json"
}
```

```jsonc
// alfred-config-my-app/index.json
{
  "skills": [
    "@alfred/skill-parcel",
    ["@alfred/skill-babel", {
      "presets": [
        "@babel-preset-env",
        "@babel-preset-flow",
        "@babel-preset-react"
      ],
    }],
    ["@alfred/skill-eslint", {
      "rules": {
        "no-console": "off"
      }
    }]
  ]
}
```

This config can be imported like so:

```jsonc
{
  "alfred": {
    "extends": "my-app"
  }
}
```

## Alfred Libraries Suggesting Skills

Assume `react` has the following `package.json`:

```jsonc
{
  "name": "react",
  // ...
  "alfred": {
    // ...
    "lib": {
      "recommendSkills": ["@alfred/skill-react"]
    }
  }
}
```

When a author of the app installs `react`, Alfred will recommend the skills `recommendSkills` on `postinstall` of `react`. This translates to users of a library automatically having the infra they need to use an app 😲

```
$ yarn add react

`react` recommends installing the Alfred skill "@alfred/skill-react".

Would you like to install it? (Y/n)
```

## Roadmap

### v1.0.0
* Implement at least one skill for each type of JS infrastructure

### Post v1.0.0
* `alfred migrate`: Migration script to Alfred
* `alfred upgrade`: Upgrade codebase to latest codebase to latest ES version
* `alfred bug`: Generating bug reports on user's behalf
* `alfred doc`: Generating documentation that will be rendered to `README.md` and html

## Alfred Skills Implementation Status

| Infrastructure     | Skills                   | Implemented  |
| ---                | ---                      | ---          |
| Bundlers           |  Webpack, Rollup, Parcel | ✅           |
| Transpilers        |  Babel                   | ✅           |
| Test Frameworks    |  Jest, Mocha, Jasmine    | ✅ ✅ ❌     |
| Formatters         |  Prettier                | ✅           |
| Libraries          |  Lodash, Moment          | ✅           |
| Linters            |  ESLint                  | ✅           |
| Front End          |  React, Angular, Vue     | ✅ ❌        |
| State Managment    |  Redux, Mobx             | ❌           |
| Routing            |  react-router            | ❌           |
| Documentation      |  JSDoc, Typedoc          | ❌           |
| Type Checkers      |  Flow, TypeScript        | ❌           |
| End to End Testing |  TestCafe, Cypress       | ❌           |

## Prior Art

* [Cargo](https://github.com/rust-lang/cargo)
* [NPM](https://npmjs.org), [Yarn](https://yarnpkg.com)
* [Yeoman](http://yeoman.io)
* [create-react-app](https://github.com/facebook/create-react-app)
* [react-boilerplate](https://www.github.com/react-boilerplate/react-boilerplate), [electron-react-boilerplate](https://www.github.com/electron-react-boilerplate/electron-react-boilerplate), and [many many other boilerplates](https://github.com/search?q=boilerplate)

## Inspiration

* [parcel](http://parceljs.org)
* [elm](https://elm-lang.org)
* [Cargo](https://github.com/rust-lang/cargo)
* [NPM](https://npmjs.org), [Yarn](https://yarnpkg.com)
* [webpack-merge](https://github.com/survivejs/webpack-merge)

## Philosophy

* High Level
* Opinionated
* Simplicity
* Reusability