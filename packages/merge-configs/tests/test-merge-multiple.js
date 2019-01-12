/* eslint-env mocha */
const { multiple } = require('..');
const mergeMultipleTests = require('./merge-multiple-tests');

describe('Multiple merge', () => {
  const merge = multiple;

  mergeMultipleTests(merge);
});
