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
yarn build:watch

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
yarn docs:build
GIT_USER=your-github-username USE_SSH=true yarn docs:deploy
yarn docs:clean
```

To change verdaccio configs, see `~/.config/verdaccio/config.yaml`

## Philosophy

* High Level
* Opinionated
* Simplicity
* Reusability

## Guidelines for Writing Docs

Alfred was designed to be used by JS developers of all levels of experience, including beginners. Beacuse of this, we've decided to focus on making our documentation easy to read and accessible. To accomplish this, we have adopted George Orwell's 5 rules of writing as part of our documentation review process.

1. Never use a metaphor, simile, or other figure of speech which you are used to seeing in print.
2. Never use a long word where a short one will do.
3. If it is possible to cut a word out, always cut it out.
4. Never use the passive where you can use the active.
5. Never use a foreign phrase, a scientific word, or a jargon word if you can think of an everyday English equivalent.
