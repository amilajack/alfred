import assert from 'assert';
import app from '../src/lib.node';

describe('app', () => {
  it('should be truthy', () => {
    assert.equal(app(), undefined);
  });
});
