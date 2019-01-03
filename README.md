alfred
======
[![Build Status](https://travis-ci.com/amilajack/alfred.svg?token=stGf151gAJ11ZUi8LyvG&branch=master)](https://travis-ci.com/amilajack/alfred)

Alfred is a configuration manager that defines a standard workflow for JavaScript projects

## Goals
* Standardizing and simplifying JS infra and conventions
* Allow extensibility of Alfred-configured infra
* Ease of integration and migration Alfred
* Provide opinionated configuration out of the box that meets the needs of most users
* Encourage JS best practices

## Installation
```bash
# NPM
npm install --global alfred
# Yarn
yarn global add alfred
```

## Usage
```bash
# Creating a new project
alfred new my-lib --lib
alfred new my-app
cd my-app

# Standard scripts
alfred start
alfred build
alfred format
alfred search
alfred test
alfred doc
alfred migrate

# Learning skills
alfred learn alfred-skill-build-parcel
# Build using the new subcommand
alfred build
# Learning multiple skills
alfred learn alfred-skill-build-angular alfred-skill-build-redux

# Upgrading from ES5 to ESNext
alfred migrate .
alfred migrate . --transforms imports lebab
```

## Local Setup
```bash
git clone https://github.com/amilajack/alfred
cd alfred
lerna bootstrap # If you don't have it, run `npm i -g lerna`
lerna link
lerna run build
```

## Config Transformer Function Example
The following is an example of a Config Transformer Function (CTF) for babel
```js
// index.js
export default {
  name: 'babel',
  interface: 'alfred-interface-transpile',
  dependencies: {
    '@babel/cli': '7.2.0',
    '@babel/core': '7.2.0',
    '@babel/preset': 'env@7.2.0'
  },
  description: 'Transpile JS from ESNext to the latest ES version',
  configFiles: [
    {
      name: 'babelrc',
      path: '.babelrc.js',
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
        .addDependencies({ 'babel-loader': '10.0.0' });
    },
    eslint: (eslintCtf: CtfNode): CtfNode => {
      return eslintCtf
        .extendConfig('eslint', {
          'parser': 'babel-eslint'
        })
        .addDependencies({ 'babel-eslint': '10.0.0' });
    }
  }
};
```

## Interface Example
```js
// index.js
export default {
  subcommand: 'transpile',
  flags: {
    // Flag name and argument types
    'environment': ['production', 'development', 'test']
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
    "npmClient": "yarn",
    "showConfigs" true,
    "targets": {
      "node": 10
    }
  }
}
```

## Alfred Skill Example

`peerDependencies` are specified in the `package.json` of a skill. They are not `dependencies` because by determining dependencies in CTFs, they can be extended. Users can write their own CTFs to customize which dependencies they want installed. Customizing dependencies, however, should be considered an antipattern because they use versions of a dependency that may not be supported by a skill.

```jsonc
// package.json
{
  "name": "alfred-skill-parcel",
  "interface": "alfred-interface-build",
  "peerDependencies": {
    "react": "0.15.0"
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
      "recommendSkills": ["alfred-skill-react"]
    }
  }
}
```

When a author of the app installs `react`, Alfred will recommend the skills `recommendSkills` on `postinstall` of `react`. This translates to users of a library automatically having the infra they need to use an app 😲

```
$ yarn add react

`react` recommends installing the Alfred skill `"alfred-skill-react"`.

Would you like to install it? (Y/n)
```

## Required Files and Folders

* `./src/main.js` or `./src/lib.js`
* `.editorconfig`
* `.gitignore`
* `.travis.yml`
* `LICENSE`
* `package.json`
* `package-lock.json` or `yarn.lock`
* `README.md`
