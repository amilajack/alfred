const { multiple } = require('..');
const mergeMultipleTests = require('./merge-multiple');

describe('Multiple merge', () => {
  const merge = multiple;

  mergeMultipleTests(merge);
});
