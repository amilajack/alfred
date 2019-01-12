/* eslint-env mocha */
const { smart } = require('..');
const mergeTests = require('./merge-tests');
const mergeSmartTests = require('./merge-smart-tests');

describe('Smart merge', () => {
  const merge = smart;

  mergeTests(merge);
  mergeSmartTests(merge);
});
