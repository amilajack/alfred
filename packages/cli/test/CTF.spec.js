import CTF, { CORE_CTFS, INTERFACE_STATES } from '@alfredpkg/core';
import {
  diffCtfDeps,
  addMissingStdSkillsToCtf,
  loadConfigs,
  diffCtfDepsOfAllInterfaceStates
} from '../src/helpers/CTF';
import parcel from '../../alfred-skill-parcel';

const [defaultInterfaceState] = INTERFACE_STATES;

const defaultAlfredConfig = {
  root: '/',
  skills: [],
  npmClient: 'npm'
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
    {
      const alfredConfig = await loadConfigs();
      const { webpack } = CORE_CTFS;
      const ctf = CTF([webpack], alfredConfig, defaultInterfaceState);
      expect(Array.from(ctf.keys())).toMatchSnapshot();
      expect(
        Array.from(addMissingStdSkillsToCtf(ctf, defaultInterfaceState).keys())
      ).toMatchSnapshot();
    }
    {
      const alfredConfig = await loadConfigs();
      const interfaceState = {
        env: 'production',
        projectType: 'app',
        target: 'browser'
      };
      const ctf = CTF([parcel], alfredConfig, interfaceState);
      expect(Array.from(ctf.keys())).toMatchSnapshot();
      const ctfSkillNames = Array.from(
        addMissingStdSkillsToCtf(ctf, interfaceState).keys()
      );
      expect(ctfSkillNames).toMatchSnapshot();
      expect(ctfSkillNames).toContain('parcel');
      expect(ctfSkillNames).not.toContain('rollup');
      expect(ctfSkillNames).not.toContain('webpack');
    }
    {
      const alfredConfig = await loadConfigs();
      const interfaceState = {
        env: 'production',
        projectType: 'lib',
        target: 'browser'
      };
      const ctf = CTF([parcel], alfredConfig, interfaceState);
      expect(Array.from(ctf.keys())).toMatchSnapshot();
      const ctfSkillNames = Array.from(
        addMissingStdSkillsToCtf(ctf, interfaceState).keys()
      );
      expect(ctfSkillNames).toMatchSnapshot();
      expect(ctfSkillNames).toContain('rollup');
      expect(ctfSkillNames).not.toContain('parcel');
      expect(ctfSkillNames).not.toContain('webpack');
    }
  });

  it('should override core ctf skills that support same interface states', async () => {
    const alfredConfig = await loadConfigs();
    const interfaceState = {
      env: 'production',
      projectType: 'app',
      target: 'browser'
    };
    const ctf = CTF([parcel], alfredConfig, interfaceState);

    expect(Array.from(ctf.keys())).toMatchSnapshot();
    const ctfSkillNames = Array.from(
      addMissingStdSkillsToCtf(ctf, interfaceState).keys()
    );
    expect(ctfSkillNames).toMatchSnapshot();
    expect(ctfSkillNames).toContain('parcel');
    expect(ctfSkillNames).not.toContain('rollup');
    expect(ctfSkillNames).not.toContain('webpack');
  });

  it('should not use CTF skills that do not support current interface state', async () => {
    const alfredConfig = await loadConfigs();
    const interfaceState = {
      env: 'production',
      projectType: 'lib',
      target: 'browser'
    };
    const ctf = CTF([parcel], alfredConfig, interfaceState);
    expect(Array.from(ctf.keys())).toEqual([]);
    const ctfSkillNames = Array.from(
      addMissingStdSkillsToCtf(ctf, interfaceState).keys()
    );
    expect(ctfSkillNames).toMatchSnapshot();
    expect(ctfSkillNames).not.toContain('parcel');
    expect(ctfSkillNames).toContain('rollup');
    expect(ctfSkillNames).not.toContain('webpack');
  });

  it.skip('should diff ctfs for all interface states', async () => {
    const currentAlfredConfig = {
      ...defaultAlfredConfig,
      skills: [...defaultAlfredConfig.skills, '@alfredpkg/skill-parcel']
    };
    const result = await diffCtfDepsOfAllInterfaceStates(
      defaultAlfredConfig,
      currentAlfredConfig
    );
    expect(result).toContain('parcel');
    expect(result).toMatchSnapshot('parcel');
  });
});
