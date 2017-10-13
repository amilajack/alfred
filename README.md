## What is Alfred?
* A project migrator
* A configuration/boilerplate manager
* Allows for extensibility


## Installation
```bash
# Yarn
yarn add --global alfred

# NPM
npm install --global alfred
```

## Usage
```bash
# Add boilerplate files
alfred bootstrap
alfred bootstrap --include editorconfig .gitignore babel flow

# Code migration
alfred migrate .
alfred migrate . --transforms imports lebab
```

## Spec
* Check for `version` in `package.json` `"alfred"` config, update files as necessary
* Allow for project specific configurations
* Bootstrap applications by adding boilerplate, allow user to select which files should be added
* Determine standards for each project. Ex. what is the name of the build directory?

## Example configuration
In `package.json`
```json
{
  "alfred": {
    "version": "0.0.1"
  }
}
```
