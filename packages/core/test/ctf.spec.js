/* eslint no-restricted-syntax: off, import/no-extraneous-dependencies: off, guard-for-in: off, no-param-reassign: off */
import os from 'os';
import powerset from '@amilajack/powerset';
import CTF, {
  CORE_CTFS,
  INTERFACE_STATES,
  getConfigs,
  getDependencies,
  getDevDependencies,
  getExecuteWrittenConfigsMethods,
  normalizeInterfacesOfSkill,
  getInterfaceForSubcommand,
  topsortCtfs,
  callCtfFnsInOrder
} from '../src';

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
  describe('topological sort', () => {
    it('should topsort', () => {
      {
        const sortedCtfs = topsortCtfs(
          CTF(
            Object.values(CORE_CTFS),
            defaultAlfredConfig,
            INTERFACE_STATES[0]
          )
        ).map(e => e.name);
        expect(sortedCtfs).toMatchSnapshot();
        expect(Object.keys(CORE_CTFS).length).toEqual(sortedCtfs.length);
      }
      {
        const sortedCtfs = topsortCtfs(
          CTF([CORE_CTFS.react], defaultAlfredConfig, INTERFACE_STATES[0])
        ).map(e => e.name);
        expect(sortedCtfs).toMatchSnapshot();
        expect(sortedCtfs.length).toEqual(1);
      }
    });

    it('should call ctfs in order', () => {
      const ctf = CTF(
        Object.values(CORE_CTFS),
        defaultAlfredConfig,
        INTERFACE_STATES[0]
      );
      const { orderedSelfTransforms } = callCtfFnsInOrder(
        ctf,
        defaultAlfredConfig,
        INTERFACE_STATES[0]
      );

      expect(orderedSelfTransforms).toMatchSnapshot();
    });
  });

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
      INTERFACE_STATES.forEach(defaultInterfaceState => {
        it(`should get corresponding interface for interface state ${JSON.stringify(
          defaultInterfaceState
        )}`, () => {
          expect(
            getInterfaceForSubcommand(
              CTF(
                Object.values(CORE_CTFS),
                defaultAlfredConfig,
                defaultInterfaceState
              ),
              'build'
            )
          ).toMatchSnapshot();
        });
      });

      it('should error if subcommand does not exist', () => {
        INTERFACE_STATES.forEach(defaultInterfaceState => {
          expect(() =>
            getInterfaceForSubcommand(
              CTF(
                [CORE_CTFS.babel],
                defaultAlfredConfig,
                defaultInterfaceState
              ),
              'build'
            )
          ).toThrow();
        });
      });
    });
  });

  describe('executors', () => {
    it('should generate functions for scripts', () => {
      INTERFACE_STATES.forEach(defaultInterfaceState => {
        const ctf = CTF(
          [CORE_CTFS.webpack],
          defaultAlfredConfig,
          defaultInterfaceState
        );
        expect(
          getExecuteWrittenConfigsMethods(
            ctf,
            defaultInterfaceState,
            defaultAlfredConfig
          )
        ).toMatchSnapshot();
      });
    });
  });

  // Generate tests for CTF combinations
  const ctfNamesCombinations = powerset(Object.keys(CORE_CTFS)).sort();
  for (const ctfCombination of ctfNamesCombinations) {
    INTERFACE_STATES.forEach(defaultInterfaceState => {
      it(`combination ${ctfCombination.join(
        ','
      )} interface state ${JSON.stringify(defaultInterfaceState)}`, () => {
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
    });
  }

  INTERFACE_STATES.forEach(defaultInterfaceState => {
    it(`should add devDepencencies with interface state ${JSON.stringify(
      defaultInterfaceState
    )}`, () => {
      const { devDependencies } = CTF(
        Object.values(CORE_CTFS),
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
});
