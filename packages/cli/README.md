## @alfred/cli

`@alfred/cli` has the the following responsibilities
* CLI Autocompletion
* CLI coloring
* Handling CLI arguments and commands

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
