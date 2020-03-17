## @alfred/cli

### Usage

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
alfred clean
alfred run start
alfred run build
alfred run build --prod
alfred run format
alfred run test

# Planned Built-in Subcommands

# Run CI tasks (lint, build, test)
alfred run ci

# List all targets
alfred targets

# Run command for specific entrypoints
alfred entrypoint app.lib run build

# Publish all entrypoints
alfred run publish

# Publish browser library to NPM
alfred entrypoint lib.browser publish

# Publish app to GitHub pages
alfred learn @alfred/skill-github-pages
alfred entrypoint app.browser publish

# Other commandss
alfred search

# Generate documentation for your project
alfred run docs

# Upgrade your code to latest es version
alfred run migrate

# Type check your code
alfred run types

# Build using webpack skill
alfred learn @alfred/skill-webpack
alfred run build

# Learning multiple skills
alfred learn @alfred/skill-angular @alfred/skill-redux

# See docs for more commands
# https://alfred.js.org/docs/cli
```
