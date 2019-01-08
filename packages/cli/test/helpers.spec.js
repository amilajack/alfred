import CTF, { CORE_CTFS } from '../../core';
import diffCtfDeps from '../src/alfred-learn';

describe('alfred learn', () => {
  it('should install new deps after learning new skill', () => {
    const { webpack, babel } = CORE_CTFS;
    const oldCtf = CTF([webpack]);
    const newCtf = CTF([webpack, babel]);
    const ctf = diffCtfDeps(oldCtf, newCtf);
    expect(ctf).toMatchSnapshot();
  });
});
