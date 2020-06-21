const { smartStrategy } = require('..');
const mergeTests = require('./merge');
const mergeSmartTests = require('./merge-smart');
const mergeStrategyTests = require('./merge-strategy');

function mergeStrategySpecificTests(merge) {
  test('should work with nested arrays and prepend', () => {
    const a = {
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loaders: ['babel'],
            exclude: /node_modules/,
          },
        ],
      },
    };
    const b = {
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loaders: ['react-hot'],
            exclude: /node_modules/,
          },
        ],
      },
    };
    const result = {
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loaders: ['react-hot', 'babel'],
            exclude: /node_modules/,
          },
        ],
      },
    };

    expect(
      merge({
        'module.loaders.loaders': 'prepend',
      })(a, b)
    ).toEqual(result);
  });

  test('should work with nested arrays and replace', () => {
    const a = {
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loaders: ['babel'],
            exclude: /node_modules/,
          },
        ],
      },
    };
    const b = {
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loaders: ['react-hot'],
            exclude: /node_modules/,
          },
        ],
      },
    };
    const result = {
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loaders: ['react-hot'],
            exclude: /node_modules/,
          },
        ],
      },
    };

    expect(
      merge({
        'module.loaders.loaders': 'replace',
      })(a, b)
    ).toEqual(result);
  });

  test('should work with nested arrays and replace with rules', () => {
    const a = {
      module: {
        rules: [
          {
            test: /.jsx?$/,
            loaders: ['babel'],
            exclude: /node_modules/,
          },
        ],
      },
    };
    const b = {
      module: {
        rules: [
          {
            test: /.jsx?$/,
            loaders: ['react-hot'],
            exclude: /node_modules/,
          },
        ],
      },
    };
    const result = {
      module: {
        rules: [
          {
            test: /.jsx?$/,
            loaders: ['react-hot'],
            exclude: /node_modules/,
          },
        ],
      },
    };

    expect(
      merge({
        'module.rules.loaders': 'replace',
      })(a, b)
    ).toEqual(result);
  });

  test('should work with use and same types (#63)', () => {
    const a = {
      module: {
        rules: [
          {
            test: /\.js$/,
            use: 'babel',
          },
        ],
      },
    };
    const b = {
      module: {
        rules: [
          {
            test: /\.js$/,
            use: 'coffee',
          },
        ],
      },
    };
    const result = {
      module: {
        rules: [
          {
            test: /\.js$/,
            use: 'coffee',
          },
        ],
      },
    };

    expect(
      merge({
        'module.rules.use': 'replace',
      })(a, b)
    ).toEqual(result);
  });

  test('should work with two level nesting (#64)', () => {
    const common = {
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|lib)/,
            use: [
              {
                loader: 'babel-loader',
                options: {
                  cacheDirectory: true,
                },
              },
            ],
          },
        ],
      },
    };
    const prod = {
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|lib)/,
            use: [
              {
                loader: 'string-replace-loader',
                options: {
                  multiple: [
                    {
                      search: /["']ngInject["'];*/,
                      replace: '',
                      flags: 'g',
                    },
                  ],
                },
              },
              'ng-annotate-loader',
            ],
          },
        ],
      },
    };
    const expected = {
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|lib)/,
            use: [
              {
                loader: 'string-replace-loader',
                options: {
                  multiple: [
                    {
                      search: /["']ngInject["'];*/,
                      replace: '',
                      flags: 'g',
                    },
                  ],
                },
              },
              'ng-annotate-loader',
              {
                loader: 'babel-loader',
                options: {
                  cacheDirectory: true,
                },
              },
            ],
          },
        ],
      },
    };

    expect(
      merge({
        'module.rules.use': 'prepend',
      })(common, prod)
    ).toEqual(expected);
  });

  test('should work with nested arrays and replace (2)', () => {
    const a = {
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loaders: ['babel'],
            exclude: /node_modules/,
          },
        ],
      },
    };
    const b = {
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loaders: ['react-hot'],
            exclude: /node_modules/,
          },
        ],
      },
    };
    const result = {
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loaders: ['react-hot'],
            exclude: /node_modules/,
          },
        ],
      },
    };

    expect(
      merge({
        'module.loaders': 'replace',
      })(a, b)
    ).toEqual(result);
  });
}

describe('Smart merge strategy', () => {
  const merge = smartStrategy;

  mergeTests(merge());
  mergeSmartTests(merge());
  mergeStrategyTests(merge);
  mergeStrategySpecificTests(merge);
});
