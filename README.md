alfred
======
[![Build Status](https://travis-ci.com/amilajack/alfred.svg?token=stGf151gAJ11ZUi8LyvG&branch=master)](https://travis-ci.com/amilajack/alfred)

Alfred is an infrastructure framework that defines a standard workflow for JavaScript projects

## Installation
```bash
# Yarn
yarn global add alfred
# NPM
npm install --global alfred
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
alfred doc
alfred test
alfred migrate

# Learning skills
alfred skill add build-parcel
alfred skill remove lint-tslint

# Upgrading from ES5 to ESNext
alfred migrate .
alfred migrate . --transforms imports lebab
```

## CMF Example
The following is an example of a Config Manipulator Function (CMF) for babel
```js
// index.js
export default {
  name: 'babel',
  interface: ['alfred-interface-transpile'],
  subcommand: 'transpile',
  configs: [{
    name: 'babelrc',
    path: 'root/.babelrc.js'
  }],
  webpack: (configs: Array<CmfNode>) => {},
  eslint: (configs: Array<CmfNode>) => {}
};
```

## Alfred Config
```json
{
  "targets": {
    "node": 10
  }
}
```
