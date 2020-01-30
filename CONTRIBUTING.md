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

# Local Publishing
yarn global add verdaccio
verdaccio
lerna publish --registry http://localhost:4873

# Production Publishing
lerna publish
```

To change verdaccio configs, see `~/.config/verdaccio/config.yaml`

## Philosophy

* High Level
* Opinionated
* Simplicity
* Reusability
