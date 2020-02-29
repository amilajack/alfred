---
id: cli
title: Command Line Interface
---

# Commands

## `alfred new <project-name>`

Create a new Alfred project. This will allow you to choose which skills you want to bootstrap your Alfred app with.

```bash
alfred new my-project
```

## `alfred learn <skill-pkg>`

Tell Alfred to learn new skills. When running `alfred learn @alfred/skill-react`, Alfred will transform other existing skills such as webpack, babel, and rollup.

```bash
alfred learn @alfred/skill-react @alfred/skill-redux
```

## `alfred skills`

List all the skills Alfred knows for a specific project.

## `alfred run`

Run a subcommand. You can optionally pass flags directly to the skills. Here is an example of passing ESLint's [`--format` flag](https://eslint.org/docs/user-guide/command-line-interface#f-format):

```bash
# Example of passing eslint cli flags to eslint alfred skill
alfred run lint --format pretty
```

## Built-in Subcommands

## `alfred run start`

Start a development workflow of an Alfred project.

## `alfred run build`

Build your Alfred project. You can build the production build by passing the `--prod` flag like so: `alfred run build --prod`. By default, if `NODE_ENV` is set to `production`, the subcommand will be called with the `--prod` flag.

In the case that you have multiple entrypoints, such as `app.browser.js` and `lib.browser.js`, Alfred will build both targets.

```bash
alfred run build --prod
alfred run build --dev
```

## `alfred run test`

Run tests all the tests of your Alfred project.

## `alfred run format`

Format all the code in the `src` directory of your Alfred project.

## `alfred run lint`

Lint all the code in the `src` directory of your Alfred project.
