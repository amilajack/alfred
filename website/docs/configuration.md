---
id: configuration
title: Configuration
---

## Alfred Config Example

```json
// package.json
{
  "alfred": {
    // Skills that override the default skills
    "skills": [
      "@alfred/skill-webpack",
      "@alfred/skill-testcafe",
      ["@alfred/skill-eslint", {
        "rules": {
          "no-console": "off"
        }
      }]
    ],
    // Determine to install with NPM or Yarn
    // Default: 'npm'
    "npmClient": "yarn",
    // Where to write configs to
    // Default: '.' (project root)
    "configsDir": ".configs",
    // Write the configs to the configsDir directory
    // Default: true
    "showConfigs": true,
    // Config for all lib targets
    "lib": {
      "recommendSkills": ["@alfred/skill-react"]
    }
  }
}
```


## Extending Alfred Configs

Suppose you have the following Alfred config:

```json
// package.json
{
  // ...
  "alfred": {
    "skills": [
      "@alfred/skill-parcel",
      ["@alfred/skill-babel", {
        // Config for Babel
        "presets": [
          "@babel-preset-env",
          "@babel-preset-flow",
          "@babel-preset-react"
        ],
        "plugins": [
          "@babel/plugin-proposal-class-properties"
        ]
      }],
      ["@alfred/skill-eslint", {
        // Config for ESLint
        "rules": {
          "no-console": "off"
        }
      }]
    ]
  }
}
```

This config can be extracted to an Alfred config like so:

```json
// alfred-config-my-app/package.json
{
  "name": "alfred-config-my-app",
  "version": "0.0.0",
  "main": "index.json"
}
```

```json
// alfred-config-my-app/index.json
{
  "skills": [
    "@alfred/skill-parcel",
    ["@alfred/skill-babel", {
      "presets": [
        "@babel-preset-env",
        "@babel-preset-flow",
        "@babel-preset-react"
      ],
    }],
    ["@alfred/skill-eslint", {
      "rules": {
        "no-console": "off"
      }
    }]
  ]
}
```

This config can be used like so:

```json
{
  "alfred": {
    "extends": "my-app"
  }
}
```

When a author of the app installs `react`, Alfred will recommend the skills `recommendSkills` on `postinstall` of `react`. This translates to users of a library automatically having the infra they need to use an app 😲

```
$ yarn add react

`react` recommends installing the Alfred skill "@alfred/skill-react".

Would you like to install it? (Y/n)
```
