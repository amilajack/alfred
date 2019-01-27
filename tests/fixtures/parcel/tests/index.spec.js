import assert from 'assert';
import app from '../src/lib.browser';

describe('app', () => {
  it('should be truthy', () => {
    assert.equal(app(), undefined);
  });
});
