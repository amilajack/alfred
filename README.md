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
npm install --global alfred  --registry https://amilajack.com/registry
# Yarn
yarn global add alfred  --registry https://amilajack.com/registry
```

## Usage

```bash
# Create a new project
alfred new my-project
cd my-project

# Build your project
alfred run build
```

## Docs

* **[website](https://alfred.js.org)** ([alfred.js.org](https://alfred.js.org))
* **[docs](https://alfred.js.org/docs/getting-started)** ([alfred.js.org/docs/getting-started](https://alfred.js.org/docs/getting-started))
* **[api](https://alfred.js.org/api)** ([alfred.js.org/api](https://alfred.js.org/api))

## Examples

See our [examples directory](https://github.com/amilajack/alfred/tree/master/examples)

|  | Example | Descrption |
| --- | --- | --- |
| 1.|  [hello world](https://github.com/amilajack/alfred/tree/master/examples/hello-world) | A simple hello work app in node |
| 2.|  [react library](https://github.com/amilajack/alfred/tree/master/examples/react-lib) | A small button library built with React |
| 3.|  typescript | **HELP WANTED** |

## Implemented Skills

✅ Basic implementation finish
🔨 Implementation in progress
❌ To be implemented

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
| Migration          |  Lebab                     | ❌           |
| Type Checkers      |  Flow, TypeScript          | ❌           |
| End to End Testing |  TestCafe, Cypress         | ❌           |

## Implemented Targets

| Target            | Implemented  |
| ---               | ---          |
| Browser           | ✅           |
| Node              | ✅           |
| Electron          | ❌           |
| React Native      | ❌           |

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
* [Yarn](https://yarnpkg.com)
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
