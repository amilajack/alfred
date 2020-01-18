/* eslint import/no-extraneous-dependencies: off */
const webpack = require('webpack');
const { default: webpackMerge } = require('..');
const mergeTests = require('./merge');
const loadersKeys = require('./loaders-keys');

function normalMergeTest(merge, loadersKey) {
  test(`should append recursive structures with ${loadersKey}`, () => {
    const a = {
      module: {}
    };
    a.module[loadersKey] = [
      {
        test: /\.js$/,
        loader: 'a'
      },
      {
        test: /\.jade$/,
        loader: 'a'
      }
    ];
    const b = {
      module: {}
    };
    b.module[loadersKey] = [
      {
        test: /\.css$/,
        loader: 'b'
      },
      {
        test: /\.sass$/,
        loader: 'b'
      }
    ];
    const result = {
      module: {}
    };
    result.module[loadersKey] = [
      {
        test: /\.js$/,
        loader: 'a'
      },
      {
        test: /\.jade$/,
        loader: 'a'
      },
      {
        test: /\.css$/,
        loader: 'b'
      },
      {
        test: /\.sass$/,
        loader: 'b'
      }
    ];

    expect(merge(a, b)).toEqual(result);
  });

  test(`should not override loader string values with ${loadersKey}`, () => {
    const a = {};
    a[loadersKey] = [
      {
        test: /\.js$/,
        loader: 'a'
      }
    ];
    const b = {};
    b[loadersKey] = [
      {
        test: /\.js$/,
        loader: 'b'
      },
      {
        test: /\.css$/,
        loader: 'b'
      }
    ];
    const result = {};
    result[loadersKey] = [
      {
        test: /\.js$/,
        loader: 'a'
      },
      {
        test: /\.js$/,
        loader: 'b'
      },
      {
        test: /\.css$/,
        loader: 'b'
      }
    ];

    expect(merge(a, b)).toEqual(result);
  });

  test(`should not append loaders with ${loadersKey}`, () => {
    const a = {};
    a[loadersKey] = [
      {
        test: /\.js$/,
        loaders: ['a']
      }
    ];
    const b = {};
    b[loadersKey] = [
      {
        test: /\.js$/,
        loaders: ['b']
      },
      {
        test: /\.css$/,
        loader: 'b'
      }
    ];
    const result = {};
    result[loadersKey] = [
      {
        test: /\.js$/,
        loaders: ['a']
      },
      {
        test: /\.js$/,
        loaders: ['b']
      },
      {
        test: /\.css$/,
        loader: 'b'
      }
    ];

    expect(merge(a, b)).toEqual(result);
  });

  test(`should duplicate loaders with ${loadersKey}`, () => {
    const a = {};
    a[loadersKey] = [
      {
        test: /\.js$/,
        loaders: ['a']
      }
    ];
    const b = {};
    b[loadersKey] = [
      {
        test: /\.js$/,
        loaders: ['a', 'b']
      }
    ];
    const result = {};
    result[loadersKey] = [
      {
        test: /\.js$/,
        loaders: ['a']
      },
      {
        test: /\.js$/,
        loaders: ['a', 'b']
      }
    ];

    expect(merge(a, b)).toEqual(result);
  });

  test(`should not override query options for the same loader with ${loadersKey}`, () => {
    const a = {};
    a[loadersKey] = [
      {
        test: /\.js$/,
        loaders: ['a?1']
      }
    ];
    const b = {};
    b[loadersKey] = [
      {
        test: /\.js$/,
        loaders: ['a?2', 'b']
      }
    ];
    const c = {};
    c[loadersKey] = [
      {
        test: /\.js$/,
        loaders: ['a', 'b?3']
      }
    ];
    const result = {};
    result[loadersKey] = [
      {
        test: /\.js$/,
        loaders: ['a?1']
      },
      {
        test: /\.js$/,
        loaders: ['a?2', 'b']
      },
      {
        test: /\.js$/,
        loaders: ['a', 'b?3']
      }
    ];

    expect(merge(a, b, c)).toEqual(result);
  });

  test(`should not allow overriding with an empty array in ${loadersKey}`, () => {
    const a = {};
    a[loadersKey] = [
      {
        test: /\.js$/,
        loaders: ['a?1']
      }
    ];
    const b = {};
    b[loadersKey] = [];

    expect(merge(a, b)).toEqual(a);
  });
}

function normalMergeTests(merge) {
  loadersKeys.forEach(loadersKey => {
    normalMergeTest(merge, loadersKey);
  });
}

function customizeMergeTests(merge) {
  test('should allow overriding array behavior', () => {
    const first = {
      entry: ['a']
    };
    const second = {
      entry: ['b']
    };

    expect(
      merge({
        customizeArray(a) {
          return a;
        }
      })(first, second)
    ).toEqual(first);
  });

  test('should pass key to array customizer', () => {
    let receivedKey;
    const first = {
      entry: ['a']
    };
    const second = {
      entry: ['b']
    };
    const result = merge({
      customizeArray(a, b, key) {
        receivedKey = key;

        return a;
      }
    })(first, second);

    expect(receivedKey).toEqual('entry');
    expect(result).toEqual(first);
  });

  test('should allow overriding object behavior', () => {
    const first = {
      entry: {
        a: 'foo'
      }
    };
    const second = {
      entry: {
        a: 'bar'
      }
    };

    expect(
      merge({
        customizeObject(a) {
          return a;
        }
      })(first, second)
    ).toEqual(first);
  });

  test('should pass key to object customizer', () => {
    let receivedKey;
    const first = {
      entry: {
        a: 'foo'
      }
    };
    const second = {
      entry: {
        a: 'bar'
      }
    };
    const result = merge({
      customizeObject(a, b, key) {
        receivedKey = key;

        return a;
      }
    })(first, second);

    expect(receivedKey).toEqual('entry');
    expect(result).toEqual(first);
  });

  test('should customize plugins', () => {
    let receivedKey;
    const config1 = {
      plugins: [
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify('development')
          }
        }),
        new webpack.HotModuleReplacementPlugin()
      ]
    };
    const config2 = {
      plugins: [
        new webpack.DefinePlugin({
          __CLIENT__: true
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new webpack.HotModuleReplacementPlugin()
      ]
    };

    merge({
      customizeArray(a, b, key) {
        receivedKey = key;
      }
    })(config1, config2);

    expect(receivedKey).toEqual('plugins');
  });

  test('should not mutate plugins #106', () => {
    const config1 = {
      entry: {
        page1: 'src/page1',
        page2: 'src/page2'
      },
      output: {
        path: 'dist',
        publicPath: '/'
      }
    };
    const config2 = {
      entry: {
        page3: 'src/page3',
        page4: 'src/page4'
      },
      output: {
        path: 'dist',
        publicPath: '/'
      }
    };
    const enhance = {
      plugins: [new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)]
    };

    const result1 = merge(config1, enhance);
    const result2 = merge(config2, enhance);

    expect(result1.plugins.length).toEqual(1);
    expect(result2.plugins.length).toEqual(1);

    result1.plugins.push(new webpack.HotModuleReplacementPlugin());

    expect(result1.plugins.length).toEqual(2);
    expect(result2.plugins.length).toEqual(1);
  });
}

describe('Merge', () => {
  const merge = webpackMerge;

  normalMergeTests(merge);
  mergeTests(merge);
  customizeMergeTests(merge);
});

module.exports = normalMergeTests;
