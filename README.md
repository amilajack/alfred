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
alfred doc
alfred test
alfred migrate

# Learning skills
alfred skill add build-parcel
alfred skill remove lint-tslint

# Upgrading JS
alfred migrate .
alfred migrate . --transforms imports lebab
```
