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

# List all targets
alfred targets
# Run command for specific entrypoints
alfred entrypoint app.lib run build
# Publish all entrypoints
alfred publish
# Publish app to GitHub pages
alfred entrypoint app.browser publish --method github-pages
# Publish browser library to NPM
alfred entrypoint lib.browser publish
alfred search
alfred docs
alfred migrate
alfred types

# Learning skills
alfred learn @alfred/skill-webpack
# Build using webpack skill
alfred run build
# Learning multiple skills
alfred learn @alfred/skill-angular @alfred/skill-redux

# See docs for more commands
# https://alfred.js.org/docs/cli
```
