Alfred
======
[![Build Status](https://travis-ci.com/amilajack/alfred.svg?token=stGf151gAJ11ZUi8LyvG&branch=master)](https://travis-ci.com/amilajack/alfred)
[![Join the community on Spectrum](https://withspectrum.github.io/badge/badge.svg)](https://spectrum.chat/alfred)
[![Twitter Follow](https://img.shields.io/twitter/follow/alfredpkg.svg?style=social)](https://twitter.com/alfredpkg)

> ## 🛠 Status: In Development
> Alfred is currently in development. It's on the fast track to a 1.0 release, so we encourage you to use it and give us your feedback, but there are things that haven't been finalized yet and you can expect some changes.

### Alfred is a Modular JS Toolchain with the following goals:

* Standardizing and simplifying JS infrastructure and conventions
* Encourage extensible and reusable infrastructure configuration
* Provide opinionated configuration out of the box that meets the needs of most users
* Encourage and implement best practices for JS libraries and applications

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
alfred new my-lib --lib --browser
alfred new my-app
cd my-app

# Built-in Subcommands
alfred new
alfred learn
alfred skills
alfred start
alfred build
alfred build --prod
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
alfred learn @alfred/skill-parcel
# Build using the new subcommand
alfred build
# Learning multiple skills
alfred learn @alfred/skill-angular @alfred/skill-redux
```

## Docs

* **[website](https://alfred.js.org)** ([alfred.js.org](https://alfred.js.org))
* **[docs](https://alfred.js.org/docs/getting-started)** ([alfred.js.org/docs/getting-started](https://alfred.js.org/docs/getting-started))

## Examples

See our [examples directory](https://github.com/amilajack/alfred/tree/master/examples)

|  | Example | Descrption |
| --- | --- | --- |
| 1.|  [hello world](https://github.com/amilajack/alfred/tree/master/examples/hello-world) | A simple hello work app in node |
| 2.|  [react library](https://github.com/amilajack/alfred/tree/master/examples/react-lib) | A small button library built with React |
| 3.|  typescript | **HELP WANTED** |
| 4.|  react | **HELP WANTED** |

## Alfred Skill Example

The following is an example of an Alfred skill for Babel

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
  transforms: {
    react(babelSkill) {
      return babelSkill
        .extendConfig('babel', {
          presets: ['@babel/preset-react'],
          env: {
            production: {
              plugins: [
                '@babel/plugin-transform-react-inline-elements',
              ]
            },
            development: {
              plugins: ['react-hot-loader/babel']
            }
          }
        })
        .addDevDeps({
          '@babel/preset-react': '^7.8.3',
          '@babel/plugin-transform-react-inline-elements': '^7.8.3',
          'react-hot-loader': '^4.12.19'
        });
    }
  }
};
```

`peerDependencies` are specified in the `package.json` of a skill. They are not `dependencies` because by determining dependencies in skills, they can be extended. Users can write their own skills to customize which dependencies they want installed. Customizing dependencies, however, should be considered an antipattern because they use versions of a dependency that may not be supported by a skill.

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
    envs: ['production', 'development', 'test']
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
    // Determine if configs should be written to disk
    "showConfigs": true,
    // Config for all lib targets
    "lib": {
      "recommendSkills": [
        "@alfred/skill-react",
        {
          "oneOf": [
            "@alfred/skill-parcel",
            "@alfred/skill-webpack"
          ]
        }
      ]
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

## Skill Diffs

```js
// redux skill example
export default {
  name: 'redux',
  files: [
    {
      name: 'redux-routes',
      path: 'src/routes.js',
      content: `
        import { createStore, applyMiddleware } from 'redux';
        import thunk from 'redux-thunk';
        import { createHashHistory } from 'history';
        import { routerMiddleware } from 'connected-react-router';
        import createRootReducer from '../reducers';
        import type { counterStateType } from '../reducers/types';
        import { Store, counterStateType } from '../reducers/types';

        const history = createHashHistory();
        const rootReducer = createRootReducer(history);
        const router = routerMiddleware(history);
        const enhancer = applyMiddleware(thunk, router);

        function configureStore(initialState) {
         return createStore(
           rootReducer,
           initialState,
           enhancer
         );
        }

        export default { configureStore, history };
        `
    }
  ],

  // ...

  transforms: {
    typescript(skill) {
      return skill
        .applyDiff('redux-routes', `
            diff --git app/routes.js app/routes.js
            @@ -3,7 +3,7 @@ import { execSync } from 'child_process';
            + function configureStore(initialState?: counterStateType) {
            +  return createStore<*, counterStateType, *>(
            +    rootReducer,
            +    initialState,
            +    enhancer
            +  );
            + }
            - function configureStore(initialState) {
            -  return createStore(
            -    rootReducer,
            -    initialState,
            -    enhancer
            -  );
            - }
        `)
        .rename('redux-routes', 'routes.ts')
    }
  }
};
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
    "extends": "my-app-config"
  }
}
```

## Alfred Libraries Suggesting Skills

Suppose you're an author of a `react-button-library` which has the following `package.json`:

```jsonc
{
  "name": "react-button-library",
  // ...
  "alfred": {
    // ...
    "lib": {
      "recommendSkills": ["@alfred/skill-react"]
    }
  }
}
```

When a user of your library installs `react-button-library`, Alfred will recommend the skills `recommendSkills` on `postinstall` of `react-button-library`. This translates to users of a library automatically having the infra they need to use an app 😲

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

✅ Basic implementation finish
❌ Planned but not started

| Infrastructure     | Skills                     | Implemented  |
| ---                | ---                        | ---          |
| Bundlers           |  Webpack, Rollup, Parcel   | ✅           |
| Transpilers        |  Babel                     | ✅           |
| Test Frameworks    |  Jest, Mocha, Jasmine, Ava | ✅ ✅ ❌ ❌ |
| Formatters         |  Prettier                  | ✅           |
| Libraries          |  Lodash, Moment            | ✅           |
| Linters            |  ESLint                    | ✅           |
| Front End          |  React, Angular, Vue       | ✅ ❌        |
| State Managment    |  Redux, Mobx               | ❌           |
| Routing            |  react-router              | ❌           |
| Documentation      |  JSDoc, Typedoc            | ❌           |
| Type Checkers      |  Flow, TypeScript          | ❌           |
| End to End Testing |  TestCafe, Cypress         | ❌           |

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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## Donations

If this project is saving you (or your team) time, please consider supporting it on Patreon 👍 thank you!

**Donations will ensure the following:**

- 🔨 Long term maintenance of the project
- 🛣 Progress on the [roadmap](https://electron-react-boilerplate.js.org/docs/roadmap)
- 🐛 Quick responses to bug reports and help requests

<p>
  <a href="https://www.patreon.com/amilajack">
    <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
  </a>
</p>

Please [donate to our Patreon](https://www.patreon.com/join/2181265/checkout) or [PayPal](https://paypal.me/amilajack)

## Community

All feedback and suggestions are welcome!

- 💬 Join the community on [Spectrum](https://spectrum.chat/alfred)
- 📣 Stay up to date on new features and announcements on [@alfredpkg](https://twitter.com/alfredpkg).
