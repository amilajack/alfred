import CTF, { CORE_CTFS } from '@alfredpkg/core';
import { diffCtfDeps, addMissingStdSkillsToCtf } from '../src/helpers/CTF';

describe('alfred cli helpers', () => {
  it('should install new deps after learning new skill', () => {
    const { webpack, babel } = CORE_CTFS;
    const oldCtf = CTF([webpack]);
    const newCtf = CTF([webpack, babel]);
    const ctf = diffCtfDeps(oldCtf, newCtf);
    expect(ctf).toMatchSnapshot();
  });

  it('should add missing std skills to ctf', () => {
    const { webpack } = CORE_CTFS;
    const ctf = CTF([webpack]);
    expect(Array.from(ctf.keys())).toMatchSnapshot();
    expect(
      Array.from(
        addMissingStdSkillsToCtf(ctf, {
          env: 'production',
          projectType: 'app',
          target: 'browser'
        }).keys()
      )
    ).toMatchSnapshot();
  });
});
