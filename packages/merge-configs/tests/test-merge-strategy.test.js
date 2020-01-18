const { strategy } = require('..');
const normalMergeTests = require('./test-merge.test');
const mergeTests = require('./merge');
const mergeStrategyTests = require('./merge-strategy');

function mergeStrategySpecificTests(merge) {
  test('should work with nested arrays and prepend', () => {
    const a = {
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loaders: ['babel'],
            exclude: /node_modules/
          }
        ]
      }
    };
    const b = {
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loaders: ['react-hot'],
            exclude: /node_modules/
          }
        ]
      }
    };
    const result = {
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loaders: ['react-hot'],
            exclude: /node_modules/
          },
          {
            test: /.jsx?$/,
            loaders: ['babel'],
            exclude: /node_modules/
          }
        ]
      }
    };

    expect(
      merge({
        'module.loaders': 'prepend'
      })(a, b)
    ).toEqual(result);
  });
}

describe('Merge strategy', () => {
  const merge = strategy;

  normalMergeTests(merge());
  mergeTests(merge());
  mergeStrategyTests(merge);
  mergeStrategySpecificTests(merge);
});
