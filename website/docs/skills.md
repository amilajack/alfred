---
id: skills
title: The Basics
---

## Alfred Skill Example

The following is an example of an Alfred skill for Babel

```js
// index.js
export default {
  // The name that other skills will refer to this skill by
  name: 'babel',
  // The (optional) interface that this skill will implement. A skill uses an interface
  // when it is able to replace an existing subcommand. For example, both the
  // @alfred/skill-parcel and @alfred/skill-webpack skills, which both register a 'build'
  // subcommand, will both implement @alfred/interface-build. Implementing it will require
  // them to adhere to a shared set of calling conventions such as flags, subcommands, etc. In
  // the case of babel, no interface will be implemented because babel will not be invoked directly
  // as a subcommand. A bundler will always call babel.
  interfaces: [],
  // The dependencies to add to the user's devDependencies
  devDependencies: {
    '@babel/cli': '^7.0.0',
    '@babel/core': '^7.0.0',
    '@babel/preset': '^7.0.0'
  },
  description: 'Transpile JS from ESNext to the latest ES version',
  // An array of the configs introduced by the skill
  configs: [
    {
      // The name of the config. This should never include a filename extension because skills
      // have the ability to change extensions (ex. .js -> .ts) so this should not be fixed
      alias: 'babelrc',
      // The filename and the path which the config should be written to
      filename: '.babelrc.js',
      // The value of the config. Can be an object or a string
      config: {
        presets: ['@babel/preset-env']
      }
    }
  ],
  transforms: {
    react(babelSkill) {
      return babelSkill
        .extendConfig('babel', {
          presets: ['@babel/preset-react'],
          env: {
            production: {
              plugins: [
                '@babel/plugin-transform-react-inline-elements',
              ]
            },
            development: {
              plugins: ['react-hot-loader/babel']
            }
          }
        })
        .addDevDeps({
          '@babel/preset-react': '^7.8.3',
          '@babel/plugin-transform-react-inline-elements': '^7.8.3',
          'react-hot-loader': '^4.12.19'
        });
    }
  }
};
```

`peerDependencies` are specified in the `package.json` of a skill. They are not `dependencies` because by determining dependencies in skills, they can be extended. Users can write their own skills to customize which dependencies they want installed. Customizing dependencies, however, should be considered an antipattern because they use versions of a dependency that may not be supported by a skill.

```json
// package.json
{
  "name": "@alfred/skill-parcel",
  "peerDependencies": {
    "react": "^16.0.0"
  }
}
```

## Passing Flags to Skills

The following example passes flags to eslint. The example adds a custom formatter to eslint.

```bash
alfred lint --format pretty
```

For now, this **only works when `showConfigs` is set to `true`**.

## Alfred Libraries Suggesting Skills

Assume `react` has the following `package.json`:

```json
{
  "name": "react",
  // ...
  "alfred": {
    // ...
    "lib": {
      "recommendSkills": ["@alfred/skill-react"]
    }
  }
}
```
