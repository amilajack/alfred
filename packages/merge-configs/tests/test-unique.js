/* eslint import/no-extraneous-dependencies: off */
const assert = require('assert');
const webpack = require('webpack');
const { default: merge, unique } = require('..');

describe('Unique', () => {
  it('should allow unique definitions', () => {
    const output = merge({
      customizeArray: unique(
        'plugins',
        ['HotModuleReplacementPlugin'],
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
    const expected = {
      plugins: [new webpack.HotModuleReplacementPlugin()]
    };

    assert.deepEqual(output, expected);
  });
});
