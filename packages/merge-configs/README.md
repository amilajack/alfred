[![build status](https://secure.travis-ci.org/survivejs/webpack-merge.svg)](http://travis-ci.org/survivejs/webpack-merge) [![codecov](https://codecov.io/gh/survivejs/webpack-merge/branch/master/graph/badge.svg)](https://codecov.io/gh/survivejs/webpack-merge)

# webpack-merge - Merge designed for Webpack

**webpack-merge** provides a `merge` function that concatenates arrays and merges objects creating a new object. If functions are encountered, it will execute them, run the results through the algorithm, and then wrap the returned values within a function again.

This behavior is particularly useful in configuring webpack although it has uses beyond it. Whenever you need to merge configuration objects, **webpack-merge** can come in handy.

There's also a webpack specific merge variant known as `merge.smart` that's able to take webpack specifics into account (i.e., it can flatten loader definitions).

## Standard Merging

### **`merge(...configuration | [...configuration])`**

`merge` is the core, and the most important idea, of the API. Often this is all you need unless you want further customization.

```js
// Default API
const output = merge(object1, object2, object3, ...objs);

// You can pass an array of objects directly.
// This works with all available functions.
const output = merge([object1, object2, object3]);
```

### **`merge({ customizeArray, customizeObject })(...configuration | [...configuration])`**

`merge` behavior can be customized per field through a curried customization API.

```js
// Customizing array/object behavior
const output = merge({
  customizeArray(a, b, key) {
    if (key === "extensions") {
      return _.uniq([...a, ...b]);
    }

    // Fall back to default merging
    return undefined;
  },
  customizeObject(a, b, key) {
    if (key === "module") {
      // Custom merging
      return _.merge({}, a, b);
    }

    // Fall back to default merging
    return undefined;
  }
})(object1, object2, object3, ...objs);
```

For example, if the previous code was invoked with only `object1` and `object2`
with `object1` as:

```
{
    foo1: ['object1'],
    foo2: ['object1'],
    bar1: { 'object1': {} },
    bar2: { 'object1': {} },
}
```

and `object2` as:

```
{
    foo1: ['object2'],
    foo2: ['object2'],
    bar1: { 'object2': {} },
    bar2: { 'object2': {} },
}
```

then `customizeArray` will be invoked for each property of `Array` type, i.e:

```js
customizeArray(["object1"], ["object2"], "foo1");
customizeArray(["object1"], ["object2"], "foo2");
```

and `customizeObject` will be invoked for each property of `Object` type, i.e:

```js
customizeObject({ object1: {} }, { object2: {} }, bar1);
customizeObject({ object1: {} }, { object2: {} }, bar2);
```

### **`merge.unique(<field>, <fields>, field => field)`**

```js
const output = merge({
  customizeArray: merge.unique(
    "plugins",
    ["HotModuleReplacementPlugin"],
    plugin => plugin.constructor && plugin.constructor.name
  )
})(
  {
    plugins: [new webpack.HotModuleReplacementPlugin()]
  },
  {
    plugins: [new webpack.HotModuleReplacementPlugin()]
  }
);

// Output contains only single HotModuleReplacementPlugin now.
```

## Merging with Strategies

### **`merge.strategy({ <field>: '<prepend|append|replace>''})(...configuration | [...configuration])`**

Given you may want to configure merging behavior per field, there's a strategy variant:

```js
// Merging with a specific merge strategy
const output = merge.strategy({
  entry: "prepend", // or 'replace', defaults to 'append'
  "module.rules": "prepend"
})(object1, object2, object3, ...objs);
```

### **`merge.smartStrategy({ <key>: '<prepend|append|replace>''})(...configuration | [...configuration])`**

The same idea works with smart merging too (described below in greater detail).

```js
const output = merge.smartStrategy({
  entry: "prepend", // or 'replace'
  "module.rules": "prepend"
})(object1, object2, object3, ...objs);
```

## Smart Merging

### **`merge.smart(...configuration | [...configuration])`**

_webpack-merge_ tries to be smart about merging loaders when `merge.smart` is used. Loaders with matching tests will be merged into a single loader value.

Note that the logic picks up webpack 2 `rules` kind of syntax as well. The examples below have been written in webpack 1 syntax.

**package.json**

```json5
{
  scripts: {
    start: "webpack-dev-server",
    build: "webpack"
  }
  // ...
}
```

**webpack.config.js**

```js
const path = require("path");
const merge = require("webpack-merge");

const TARGET = process.env.npm_lifecycle_event;

const common = {
  entry: path.join(__dirname, "app"),
  module: {
    loaders: [
      {
        test: /\.css$/,
        loaders: ["style", "css"]
      }
    ]
  }
};

if (TARGET === "start") {
  module.exports = merge(common, {
    module: {
      // loaders will get concatenated!
      loaders: [
        {
          test: /\.jsx?$/,
          loader: "babel?stage=1",
          include: path.join(ROOT_PATH, "app")
        }
      ]
    },
    ...opts
  });
}

if (TARGET === "build") {
  module.exports = merge(common, {
    ...opts
  });
}

// ...
```

**Loader string values `loader: 'babel'` override each other.**

```js
merge.smart(
  {
    loaders: [
      {
        test: /\.js$/,
        loader: "babel"
      }
    ]
  },
  {
    loaders: [
      {
        test: /\.js$/,
        loader: "coffee"
      }
    ]
  }
);
// will become
{
  loaders: [
    {
      test: /\.js$/,
      loader: "coffee"
    }
  ];
}
```

**Loader array values `loaders: ['babel']` will be merged, without duplication.**

```js
merge.smart(
  {
    loaders: [
      {
        test: /\.js$/,
        loaders: ["babel"]
      }
    ]
  },
  {
    loaders: [
      {
        test: /\.js$/,
        loaders: ["coffee"]
      }
    ]
  }
);
// will become
{
  loaders: [
    {
      test: /\.js$/,
      // appended because Webpack evaluated these from right to left
      // this way you can specialize behavior and build the loader chain
      loaders: ["babel", "coffee"]
    }
  ];
}
```

**Loader array values `loaders: ['babel']` can be reordered by including
original loaders.**

```js
merge.smart(
  {
    loaders: [
      {
        test: /\.js$/,
        loaders: ["babel"]
      }
    ]
  },
  {
    loaders: [
      {
        test: /\.js$/,
        loaders: ["react-hot", "babel"]
      }
    ]
  }
);
// will become
{
  loaders: [
    {
      test: /\.js$/,
      // order of second argument is respected
      loaders: ["react-hot", "babel"]
    }
  ];
}
```

This also works in reverse - the existing order will be maintained if possible:

```js
merge.smart(
  {
    loaders: [
      {
        test: /\.css$/,
        use: [
          { loader: "css-loader", options: { myOptions: true } },
          { loader: "style-loader" }
        ]
      }
    ]
  },
  {
    loaders: [
      {
        test: /\.css$/,
        use: [{ loader: "style-loader", options: { someSetting: true } }]
      }
    ]
  }
);
// will become
{
  loaders: [
    {
      test: /\.css$/,
      use: [
        { loader: "css-loader", options: { myOptions: true } },
        { loader: "style-loader", options: { someSetting: true } }
      ]
    }
  ];
}
```

In the case of an order conflict, the second order wins:

```js
merge.smart(
  {
    loaders: [
      {
        test: /\.css$/,
        use: [{ loader: "css-loader" }, { loader: "style-loader" }]
      }
    ]
  },
  {
    loaders: [
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }]
      }
    ]
  }
);
// will become
{
  loaders: [
    {
      test: /\.css$/,
      use: [{ loader: "style-loader" }, { loader: "css-loader" }]
    }
  ];
}
```

**Loader query strings `loaders: ['babel?plugins[]=object-assign']` will be overridden.**

```js
merge.smart(
  {
    loaders: [
      {
        test: /\.js$/,
        loaders: ["babel?plugins[]=object-assign"]
      }
    ]
  },
  {
    loaders: [
      {
        test: /\.js$/,
        loaders: ["babel", "coffee"]
      }
    ]
  }
);
// will become
{
  loaders: [
    {
      test: /\.js$/,
      loaders: ["babel", "coffee"]
    }
  ];
}
```

**Loader arrays in source values will have loader strings merged into them.**

```js
merge.smart(
  {
    loaders: [
      {
        test: /\.js$/,
        loader: "babel"
      }
    ]
  },
  {
    loaders: [
      {
        test: /\.js$/,
        loaders: ["coffee"]
      }
    ]
  }
);
// will become
{
  loaders: [
    {
      test: /\.js$/,
      // appended because Webpack evaluated these from right to left!
      loaders: ["babel", "coffee"]
    }
  ];
}
```

**Loader strings in source values will always override.**

```js
merge.smart(
  {
    loaders: [
      {
        test: /\.js$/,
        loaders: ["babel"]
      }
    ]
  },
  {
    loaders: [
      {
        test: /\.js$/,
        loader: "coffee"
      }
    ]
  }
);
// will become
{
  loaders: [
    {
      test: /\.js$/,
      loader: "coffee"
    }
  ];
}
```

## Multiple Merging

### **`merge.multiple(...configuration | [...configuration])`**

Sometimes you may need to support multiple targets, _webpack-merge_ will accept an object where each key represents the target configuration. The output becomes an _array_ of configurations where matching keys are merged and non-matching keys are added.

```js
const path = require("path");
const baseConfig = {
  server: {
    target: "node",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "lib.node.js"
    }
  },
  client: {
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "lib.js"
    }
  }
};

// specialized configuration
const production = {
  client: {
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].[hash].js"
    }
  }
};

module.exports = merge.multiple(baseConfig, production);
```

> Check out [SurviveJS - Webpack and React](http://survivejs.com/) to dig deeper into the topic.

## Development

1. `npm i`
1. `npm run build`
1. `npm run watch`

Before contributing, please open an issue where to discuss.

## License

_webpack-merge_ is available under MIT. See LICENSE for more details.
