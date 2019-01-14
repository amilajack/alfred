import CTF, { CORE_CTFS } from '@alfredpkg/core';
import {
  diffCtfDeps,
  addMissingStdSkillsToCtf,
  loadConfigs
} from '../src/helpers/CTF';

const defaultInterfaceState = {
  projectType: 'app',
  target: 'browser',
  env: 'production'
};

describe('alfred cli helpers', () => {
  it('should install new deps after learning new skill', async () => {
    const alfredConfig = await loadConfigs();
    const { webpack, babel } = CORE_CTFS;
    const oldCtf = CTF([webpack], alfredConfig, defaultInterfaceState);
    const newCtf = CTF([webpack, babel], alfredConfig, defaultInterfaceState);
    const ctf = diffCtfDeps(oldCtf, newCtf);
    expect(ctf).toMatchSnapshot();
  });

  it('should add missing std skills to ctf', async () => {
    const alfredConfig = await loadConfigs();
    const { webpack } = CORE_CTFS;
    const ctf = CTF([webpack], alfredConfig, defaultInterfaceState);
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
