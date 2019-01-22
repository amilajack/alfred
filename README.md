alfred
======
[![Build Status](https://travis-ci.com/amilajack/alfred.svg?token=stGf151gAJ11ZUi8LyvG&branch=master)](https://travis-ci.com/amilajack/alfred)

A Modular JS Toolchain

## Goals

* Standardizing and simplifying JS infra and conventions
* Allow extensibility of Alfred-configured infra
* Ease of integration and migration Alfred
* Provide opinionated configuration out of the box that meets the needs of most users
* Encourage JS best practices

## Installation

```bash
# NPM
npm install --global @alfredpkg/cli
# Yarn
yarn global add @alfredpkg/cli
```

## Usage

```bash
# Creating a new project
alfred new my-lib --lib
alfred new my-lib --lib --browser
alfred new my-app
cd my-app

# Built-in Subcommands
alfred new
alfred learn
alfred skills
alfred start
alfred build
alfred clean
alfred format
alfred test

# Planned Built-in Subcommands
alfred targets
alfred publish
alfred search
alfred docs
alfred migrate
alfred types

# Learning skills
alfred learn @alfredpkg/skill-parcel
# Build using the new subcommand
alfred build
# Learning multiple skills
alfred learn @alfredpkg/skill-angular @alfredpkg/skill-redux
```

## Docs

* **[website](https://alfred.js.org)** ([alfred.js.org](https://alfred.js.org))
* **[docs](https://alfred.js.org/docs)** ([alfred.js.org/docs](https://alfred.js.org/docs))

## Examples

See our [examples directory](https://github.com/amilajack/alfred/tree/master/examples)

|  | Example | Descrption |
| --- | --- | --- |
| 1.|  [hello world](https://github.com/amilajack/alfred/tree/master/examples/hello-world) | A simple hello work app in node |
| 2.|  typescript | **HELP WANTED** |
| 3.|  react | **HELP WANTED** |

## Local Setup

```bash
git clone https://github.com/amilajack/alfred
cd alfred
yarn
yarn test
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
  // @alfredpkg/skill-parcel and @alfredpkg/skill-webpack skills, which both register a 'build'
  // subcommand, will both implement @alfredpkg/interface-build. Implementing it will require
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
        presets: '@babel/preset-env'
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
  "name": "@alfredpkg/skill-parcel",
  "peerDependencies": {
    "react": "0.15.0"
  }
}
```

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
      "@alfredpkg/skill-parcel",
      "@alfredpkg/skill-testcafe"
    ],
    // Determine to install with NPM or Yarn (defaults to NPM)
    "npmClient": "yarn",
    // Write the configs to a './.configs' directory
    "showConfigs" true,
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
      "recommendSkills": ["@alfredpkg/skill-react"]
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

## Alfred Libraries Suggesting Skills

Assume `react` has the following `package.json`:

```jsonc
{
  "name": "react",
  // ...
  "alfred": {
    // ...
    "lib": {
      "recommendSkills": ["@alfredpkg/skill-react"]
    }
  }
}
```

When a author of the app installs `react`, Alfred will recommend the skills `recommendSkills` on `postinstall` of `react`. This translates to users of a library automatically having the infra they need to use an app 😲

```
$ yarn add react

`react` recommends installing the Alfred skill "@alfredpkg/skill-react".

Would you like to install it? (Y/n)
```

## Required Files and Folders

* `./src/{projectType}.{target}.js`, e.g.: `./src/lib.node.js`
* `./tests/{projectType}.{target}.spec.js`, e.g.: `./tests/lib.node.spec.js`
* `.editorconfig`
* `.gitignore`
* `LICENSE`
* `package.json`
* `package-lock.json` or `yarn.lock`
* `README.md`


## Prior Art

* [Cargo](https://github.com/rust-lang/cargo)
* [NPM](https://npmjs.org), [Yarn](https://yarnpkg.com)
* [Yeoman](http://yeoman.io)
