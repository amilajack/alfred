import path from 'path';
import CTF, { CORE_CTFS, INTERFACE_STATES, loadConfig } from '@alfredpkg/core';
import {
  diffCtfDeps,
  addMissingStdSkillsToCtf,
  diffCtfDepsOfAllInterfaceStates
} from '../src/helpers';
import generateCtfFromConfig from '../src/helpers/ctf';
import parcel from '../../alfred-skill-parcel';

const [defaultInterfaceState] = INTERFACE_STATES;

const defaultAlfredConfig = {
  root: path.join(__dirname, '../../../tests/fixtures/app'),
  skills: [],
  npmClient: 'npm'
};

describe('alfred cli helpers', () => {
  const { root: projectRoot } = defaultAlfredConfig;

  it('should install new deps after learning new skill', async () => {
    const { alfredConfig } = await loadConfig(projectRoot);
    const { webpack, babel } = CORE_CTFS;
    const oldCtf = CTF([webpack], alfredConfig, defaultInterfaceState);
    const newCtf = CTF([webpack, babel], alfredConfig, defaultInterfaceState);
    const ctf = diffCtfDeps(oldCtf, newCtf);
    expect(ctf).toMatchSnapshot();
  });

  it('should add missing std skills to ctf', async () => {
    {
      const { alfredConfig } = await loadConfig(projectRoot);
      const { webpack } = CORE_CTFS;
      const ctf = CTF([webpack], alfredConfig, defaultInterfaceState);
      expect(Array.from(ctf.keys())).toMatchSnapshot();
      expect(
        Array.from(
          addMissingStdSkillsToCtf(
            ctf,
            alfredConfig,
            defaultInterfaceState
          ).keys()
        )
      ).toMatchSnapshot();
    }
    {
      const { alfredConfig } = await loadConfig(projectRoot);
      const interfaceState = {
        env: 'production',
        projectType: 'app',
        target: 'browser'
      };
      const ctf = CTF([parcel], alfredConfig, interfaceState);
      expect(Array.from(ctf.keys())).toMatchSnapshot();
      const ctfSkillNames = Array.from(
        addMissingStdSkillsToCtf(ctf, alfredConfig, interfaceState).keys()
      );
      expect(ctfSkillNames).toMatchSnapshot();
      expect(ctfSkillNames).toContain('parcel');
      expect(ctfSkillNames).not.toContain('rollup');
      expect(ctfSkillNames).not.toContain('webpack');
    }
    {
      const { alfredConfig } = await loadConfig(projectRoot);
      const interfaceState = {
        env: 'production',
        projectType: 'lib',
        target: 'browser'
      };
      const ctf = CTF([parcel], alfredConfig, interfaceState);
      expect(Array.from(ctf.keys())).toMatchSnapshot();
      const ctfSkillNames = Array.from(
        addMissingStdSkillsToCtf(ctf, alfredConfig, interfaceState).keys()
      );
      expect(ctfSkillNames).toMatchSnapshot();
      expect(ctfSkillNames).toContain('rollup');
      expect(ctfSkillNames).not.toContain('parcel');
      expect(ctfSkillNames).not.toContain('webpack');
    }
  });

  describe('skills', () => {
    it('should throw if skill does not exist', async () => {
      const [state] = INTERFACE_STATES;
      const config = {
        ...defaultAlfredConfig,
        skills: [['@alfredpkg/skill-non-existent-skill', {}]]
      };
      await expect(generateCtfFromConfig(config, state)).rejects.toThrow(
        "Cannot find module '@alfredpkg/skill-non-existent-skill' from 'ctf.js'"
      );
    });

    it('should throw if unsupported skill is used', async () => {
      const [state] = INTERFACE_STATES;
      const config = {
        ...defaultAlfredConfig,
        skills: [['@alfredpkg/skill-non-existent-skill', {}]]
      };
      await expect(generateCtfFromConfig(config, state)).rejects.toThrow(
        "Cannot find module '@alfredpkg/skill-non-existent-skill' from 'ctf.js'"
      );
    });
  });

  it('should override core ctf skills that support same interface states', async () => {
    const { alfredConfig } = await loadConfig(projectRoot);
    const interfaceState = {
      env: 'production',
      projectType: 'app',
      target: 'browser'
    };
    const ctf = CTF([parcel], alfredConfig, interfaceState);

    expect(Array.from(ctf.keys())).toMatchSnapshot();
    const ctfSkillNames = Array.from(
      addMissingStdSkillsToCtf(ctf, alfredConfig, interfaceState).keys()
    );
    expect(ctfSkillNames).toMatchSnapshot();
    expect(ctfSkillNames).toContain('parcel');
    expect(ctfSkillNames).not.toContain('rollup');
    expect(ctfSkillNames).not.toContain('webpack');
  });

  it('should not use CTF skills that do not support current interface state', async () => {
    const { alfredConfig } = await loadConfig(projectRoot);
    const interfaceState = {
      env: 'production',
      projectType: 'lib',
      target: 'browser'
    };
    const ctf = CTF([parcel], alfredConfig, interfaceState);
    expect(Array.from(ctf.keys())).toEqual([]);
    const ctfSkillNames = Array.from(
      addMissingStdSkillsToCtf(ctf, alfredConfig, interfaceState).keys()
    );
    expect(ctfSkillNames).toMatchSnapshot();
    expect(ctfSkillNames).not.toContain('parcel');
    expect(ctfSkillNames).toContain('rollup');
    expect(ctfSkillNames).not.toContain('webpack');
  });

  it('should diff ctfs for all interface states', async () => {
    const skills = [
      ...defaultAlfredConfig.skills,
      '@alfredpkg/skill-parcel'
    ].map(e => [e, {}]);
    const currentAlfredConfig = {
      ...defaultAlfredConfig,
      skills
    };
    const result = await diffCtfDepsOfAllInterfaceStates(
      defaultAlfredConfig,
      currentAlfredConfig
    );
    expect(result).toEqual(['parcel@^1.11.0']);
  });
});
