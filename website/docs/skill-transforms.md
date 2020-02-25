---
id: skill-transforms
title: Transforms
---

*This documentation is a work in progress*

The following is a basic example of a skill:

```js
const skill = {
  name: 'eslint',
  devDependencies: {
    'eslint-config-airbnb': '18.0.0'
  },
  configs: [
    {
      alias: 'eslint',
      filename: '.eslintrc.js',
      config: {
        plugins: [
          'eslint-plugin-prettier'
        ]
      }
    }
  ],
  transforms: {
    react(eslintSkill) {
      return eslintSkill
        .extendConfig('eslint', {
          plugins: [
            'eslint-plugin-react'
          ]
        })
        .addDevDeps({
          'eslint-plugin-react': '7.18.0'
        });
    }
  }
};

export default skill;
```

## Configs

Configs are added through the `configs` property. Each config can have an optional `alias` which makes it easy to reference them in transforms. If no `alias` is provided, configs must be referenced in transforms by their `filename`. The `config` property is the value of the initial config before any transformations are applied.

## Transforms

Transforms are what transform the skill's config to be compatible with another skill. In the example above, the `react` transform is transforming the `eslint` skill's config to be compatible with the `eslint` skill. Transforms always transform their own configs. They also always return a the finally transformed skill.

So transforms take a skill as input and return a skill as output.

#### Extending Configs

Alfred skills have helpers functions that make writing skills easy. The `extendConfig` helper allows you to extend configs.

#### Serializing Configs

Serializing configs which cannot be serialized easily. This is done with the `serialize`. Here is an example:

```js
const webpackSkill = {
  name: 'webpack',
  // ...
  transforms: {
    lodash(skill: Skill): Skill {
      return skill
        .extendConfig('webpack.prod', {
          plugins: [
            configStringify`(() => {
              const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
              return new LodashModuleReplacementPlugin()
            })()`
          ]
        })
        .addDepsFromPkg('lodash-webpack-plugin');
    }
  }
}

export default skill;
```
