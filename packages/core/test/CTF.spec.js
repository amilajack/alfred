/* eslint no-restricted-syntax: off, import/no-extraneous-dependencies: off, guard-for-in: off, no-param-reassign: off */
import os from 'os';
import powerset from '@amilajack/powerset';
import CTF, {
  CORE_CTFS,
  getConfigs,
  getDependencies,
  getDevDependencies,
  getExecuteWrittenConfigsMethods,
  normalizeInterfacesOfSkill,
  getInterfaceForSubcommand
} from '../src';

const defaultInterfaceState = {
  projectType: 'app',
  target: 'browser',
  env: 'production'
};

const defaultAlfredConfig = {
  root: '/',
  skills: [],
  npmClient: 'npm'
};

function removePathsPropertiesFromObject(obj) {
  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'object') {
      removePathsPropertiesFromObject(value);
    }

    if (typeof value === 'string' && value.includes(os.homedir())) {
      obj[key] = '/';
    }
  }
  return obj;
}

describe('CTF', () => {
  describe('interfaces', () => {
    it('should allow falsy inputs', () => {
      expect(normalizeInterfacesOfSkill(undefined)).toEqual([]);
      expect(normalizeInterfacesOfSkill(undefined)).toEqual([]);
    });

    it('should allow array of strings input', () => {
      expect(
        normalizeInterfacesOfSkill(['@alfredpkg/interface-build'])
      ).toMatchSnapshot();
      expect(
        normalizeInterfacesOfSkill([
          '@alfredpkg/interface-build',
          '@alfredpkg/interface-start'
        ])
      ).toMatchSnapshot();
    });

    it('should not allow non-array or string inputs', () => {
      expect(() =>
        normalizeInterfacesOfSkill({
          '@alfredpkg/interface-build': {},
          '@alfredpkg/interface-start': {}
        })
      ).toThrow();
      expect(() => normalizeInterfacesOfSkill('incorrect-input')).toThrow();
    });

    describe('subcommand', () => {
      it('should get corresponding interface', () => {
        expect(
          getInterfaceForSubcommand(
            CTF(Object.values(CORE_CTFS), defaultAlfredConfig),
            'build'
          )
        ).toMatchSnapshot();
      });

      it('should error if subcommand does not exist', () => {
        expect(() =>
          getInterfaceForSubcommand(CTF([CORE_CTFS.babel]), 'build')
        ).toThrow();
      });
    });
  });

  describe('executors', () => {
    let ctf;

    beforeAll(() => {
      ctf = CTF([CORE_CTFS.webpack]);
    });

    it('should generate functions for scripts', () => {
      expect(
        getExecuteWrittenConfigsMethods(ctf, {
          target: 'app',
          env: 'production',
          projectType: 'lib'
        })
      ).toMatchSnapshot();
    });
  });

  // Generate tests for CTF combinations
  const ctfNamesCombinations = powerset(Object.keys(CORE_CTFS)).sort();
  for (const ctfCombination of ctfNamesCombinations) {
    it(`combination ${ctfCombination.join(',')}`, () => {
      expect(ctfCombination).toMatchSnapshot();
      // Get the CTFs for each combination
      const filteredCtfs = ctfCombination.map(ctfName => CORE_CTFS[ctfName]);
      const result = CTF(
        filteredCtfs,
        defaultAlfredConfig,
        defaultInterfaceState
      );
      expect(
        removePathsPropertiesFromObject(getConfigs(result))
      ).toMatchSnapshot();
      expect(getDependencies(result)).toMatchSnapshot();
      expect(getDevDependencies(result)).toMatchSnapshot();
    });
  }

  it('should add devDepencencies', () => {
    const { devDependencies } = CTF(
      [CORE_CTFS.webpack],
      defaultAlfredConfig,
      defaultInterfaceState
    )
      .get('webpack')
      .addDevDependencies({
        foobar: '0.0.0'
      });
    expect(devDependencies).toMatchSnapshot();
  });
});
