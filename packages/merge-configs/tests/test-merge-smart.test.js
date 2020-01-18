const { smart } = require('..');
const mergeTests = require('./merge');
const mergeSmartTests = require('./merge-smart');

describe('Smart merge', () => {
  const merge = smart;

  mergeTests(merge);
  mergeSmartTests(merge);
});
