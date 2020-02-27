---
id: concepts
title: Concepts
---

## Projects

Most projects are either one of two types: an app or a library. Alfred calls these different project types 'projects'. Alfred uses these project types to determine how it should bundle your project.

## Platforms

JavaScript can run on many possible platforms, including NodeJS, the browser, electron, and others. At the moment, Alfred only supports the NodeJS and the browser.

#### Planned Platform Additions

In the near future, Alfred will add support for `electron` and `react-native` platforms. These platforms are not added yet because beacuse they are not supported by any [skills](skills) yet.

## Entrypoints

Entrypoints are files that serve as the 'starting point' of an Alfred project. Alfred entrypoints serve two main purposes:

* Determine what the `platform` and `project` are
* Serve as the entrypoint for bundlers such as webpack, rollup, and parcel

Here are some examples of entrypoints:

* `lib.browser.js`
* `app.node.js`
* `app.browser.js`

As you can see, entrypoint files always follow the form `{project}.{platform}.js`. These way of defining entrypoints allows you to easily add multiple entrypoints. Alfred will process each entrypoint with respect to its project and platform.

## Targets

A target is simpliy the output of an Alfred build. The output a  bundlers depend on three factors: the environment, [project](projects), and [platform](platforms). The environment can either be `development`, `production`, or `test`. Alfred targets are outputted to a `targets/{environment}/{project}.{platform}.js` directory.
