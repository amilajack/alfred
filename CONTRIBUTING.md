## Local Setup

```bash
# Installation
git clone https://github.com/amilajack/alfred
cd alfred
yarn

# Testing
yarn test

# Building
yarn build
# Watching the build
yarn build-watch

# Linking
yarn workspace alfred link

# Publishing to NPM registry
lerna publish

# Publishing Locally
yarn global add verdaccio
verdaccio
lerna publish --registry http://localhost:4873

# Publishing to production
lerna publish

# Documentation publishing
yarn api-docs
GIT_USER=your-github-username USE_SSH=true yarn workspace website deploy
```

To change verdaccio configs, see `~/.config/verdaccio/config.yaml`

## Philosophy

* High Level
* Opinionated
* Simplicity
* Reusability
