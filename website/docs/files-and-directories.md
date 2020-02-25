---
id: files-and-directories
title: Files and Directories
---

Sometimes adding integration with a specific tool requires "boilerplate" files that are not configuration files. For example, [redux](https://redux.js.org/) requires `root.js`, `configureStore.js`, and other boilerplate files. Because of this, Alfred provides `files` and `dirs` properties which let writers of [skills](skills) easily add boilerplate files and entire boilerplate directories to a user's project.

Here is an example of how the react skill uses the `files` API to add react support to a project:

```js
const reactSkill = {
  name: 'react',
  // ...
  files: [
    {
      src: path.join(__dirname, '../boilerplate/index.html'),
      dest: 'src/index.html'
    },
    // ...
  ]
};

export default reactSkill;
```

The `dest` property determines where the file is written to relative to the user's root project directory. The `src` property is the path to the file you want to write to to the location given by `dest`.

## Conditionally Adding Files

```js
const reactSkill = {
  name: 'react',
  files: [
    {
      src: path.join(__dirname, '../boilerplate/index.html'),
      dest: 'src/index.html',
      condition(args) {
        const { project } = args;
        return project.targets.some(target => {
          return target.platform === 'browser' && target.project === 'app';
        });
      }
    },
    // ...
  ],
  // ...
};

export default reactSkill;
```

You may want to write a file only if certain conditions are met. Returning `true` from `condition` will determine if the file should be written or not. In the example above, the file will be written if at least one target is a browser app.

## Transforming Files

Similar to configs which are transformed by functions in `transforms`, skills can also change their files to be compatible with other skills.

```js
const reduxSkill = {
  name: 'redux',
  files: [
    {
      alias: 'configureStore',
      filename: 'configureStore.js',
      content:
`import { applyMiddleware, compose, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';

export default function configureStore(preloadedState) {
  // ...
}`
    }
  ],
  transforms: {
    typescript(skill) {
      skill.files
        .get('configureStore')
        .rename('configureStore.ts')
        .replace(
          'export default function configureStore(preloadedState) {',
          'export default function configureStore(preloadedState: State): Store {'
        );
      return skill;
    }
  }
}

export default reduxSkill;
```

Alfred provides some helpful ways of transforming files. Currently, Alfred supports file transformations through the following methods: applying diffs and string replacement. Note that directly writing files to the file system is highly discouraged.

#### Applying Diffs

*This section is a work in progress*

#### String Replacement

Content in files can either be replaced by the `replace` method, which can be used in two ways:

Replacing an entire file with the given content:

```js
.replace('module.exports = {}')
```

Or giving a string to search for and replacing that matched string with the given content:

```js
.replace('module.exports = {}', 'export default {}')
```

## When Files are Written

Files are written during the `afterLearn` and `afterNew` [hooks](skill-hooks). Only skills that are newly learned will have their files transformed.
