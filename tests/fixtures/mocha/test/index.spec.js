import app from '../src/lib.browser';
import assert from 'assert';

describe('app', () => {
  it('should be truthy', () => {
    assert.equal(app(), undefined);
  });
});
