/* eslint no-restricted-syntax: off, import/no-extraneous-dependencies: off, guard-for-in: off, no-param-reassign: off */
import os from 'os';
import path from 'path';
import powerset from '@amilajack/powerset';
import { getConfigs } from '@alfred/helpers';
import {
  getExecutableWrittenConfigsMethods,
  getInterfaceForSubcommand
} from '../src/commands';
import CTF, {
  CORE_CTFS,
  getDependencies,
  getDevDependencies,
  generateCtfFromProject,
  diffCtfDepsOfAllInterfaceStates,
  diffCtfDeps,
  topsortCtfs,
  addMissingDefaultSkillsToCtf,
  callCtfFnsInOrder
} from '../src/ctf';
import { normalizeInterfacesOfSkill, INTERFACE_STATES } from '../src/interface';
import Config from '../src/config';

const parcel = require('../../alfred-skill-parcel');

const [defaultInterfaceState] = INTERFACE_STATES;

const defaultProject = {
  root: path.join(__dirname, '../../../tests/fixtures/app'),
  pkgPath: path.join(__dirname, '../../../tests/fixtures/app/package.json'),
  pkg: require(path.join(
    __dirname,
    '../../../tests/fixtures/app/package.json'
  )),
  config: new Config({
    skills: [],
    npmClient: 'npm'
  })
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
          CTF(Object.values(CORE_CTFS), defaultInterfaceState)
        ).map(e => e.name);
        expect(sortedCtfs).toMatchSnapshot();
        expect(Object.keys(CORE_CTFS).length).toEqual(sortedCtfs.length);
      }
      {
        const sortedCtfs = topsortCtfs(
          CTF([CORE_CTFS.react], INTERFACE_STATES[0])
        ).map(e => e.name);
        expect(sortedCtfs).toMatchSnapshot();
        expect(sortedCtfs.length).toEqual(1);
      }
    });

    it('should call ctfs in order', () => {
      const ctf = CTF(Object.values(CORE_CTFS), INTERFACE_STATES[0]);
      const { orderedSelfTransforms } = callCtfFnsInOrder(
        defaultProject,
        ctf,
        INTERFACE_STATES[0]
      );

      expect(orderedSelfTransforms).toMatchSnapshot();
    });

    it('should allow cycles with non-conflicting ctf nodes', () => {
      const ctfNode1 = {
        name: 'ctf-node-1',
        description: '',
        ctfs: {
          'ctf-node-2': () => {}
        }
      };
      const ctfNode2 = {
        name: 'ctf-node-2',
        description: '',
        ctfs: {
          'ctf-node-1': () => {}
        }
      };
      const ctf = CTF([ctfNode1, ctfNode2], INTERFACE_STATES[0]);
      callCtfFnsInOrder(defaultProject.config, ctf, INTERFACE_STATES[0]);
    });
  });

  describe('interfaces', () => {
    it('should diff ctfs for all interface states', async () => {
      const skills = [
        ...defaultProject.config.skills,
        '@alfred/skill-mocha'
      ].map(e => [e, {}]);
      const currentConfig = {
        ...defaultProject.config,
        skills
      };
      const result = await diffCtfDepsOfAllInterfaceStates(
        defaultProject.config,
        currentConfig
      );
      expect(result).toEqual(['mocha@5.2.0']);
    });

    it('should allow falsy inputs', () => {
      expect(normalizeInterfacesOfSkill(undefined)).toEqual([]);
      expect(normalizeInterfacesOfSkill(undefined)).toEqual([]);
    });

    it('should allow array of strings input', () => {
      expect(
        normalizeInterfacesOfSkill(['@alfred/interface-build'])
      ).toMatchSnapshot();
      expect(
        normalizeInterfacesOfSkill([
          '@alfred/interface-build',
          '@alfred/interface-start'
        ])
      ).toMatchSnapshot();
    });

    it('should not allow non-array or string inputs', () => {
      expect(() =>
        normalizeInterfacesOfSkill({
          '@alfred/interface-build': {},
          '@alfred/interface-start': {}
        })
      ).toThrow();
      expect(() => normalizeInterfacesOfSkill('incorrect-input')).toThrow();
    });

    describe('subcommand', () => {
      INTERFACE_STATES.forEach(interfaceState => {
        it(`should get corresponding interface for interface state ${JSON.stringify(
          interfaceState
        )}`, () => {
          expect(
            getInterfaceForSubcommand(
              CTF(Object.values(CORE_CTFS), interfaceState),
              'build'
            )
          ).toMatchSnapshot();
        });
      });

      it('should error if subcommand does not exist', () => {
        INTERFACE_STATES.forEach(interfaceState => {
          expect(() =>
            getInterfaceForSubcommand(
              CTF([CORE_CTFS.babel], interfaceState),
              'build'
            )
          ).toThrow();
        });
      });
    });
  });

  describe('executors', () => {
    it('should generate functions for scripts', () => {
      INTERFACE_STATES.forEach(interfaceState => {
        const ctf = CTF([CORE_CTFS.webpack], interfaceState);
        expect(
          getExecutableWrittenConfigsMethods(
            defaultProject,
            ctf,
            interfaceState
          )
        ).toMatchSnapshot();
      });
    });
  });

  describe('alfred cli helpers', () => {
    const { root: projectRoot } = defaultProject;

    it('should add missing std skills to ctf', async () => {
      {
        const config = await Config.initFromProjectRoot(projectRoot);
        const currentDefaultProject = {
          ...defaultProject,
          config
        };
        const { webpack } = CORE_CTFS;
        const ctf = CTF([webpack], defaultInterfaceState);
        expect(Array.from(ctf.keys())).toMatchSnapshot();
        expect(
          Array.from(
            addMissingDefaultSkillsToCtf(
              currentDefaultProject,
              ctf,
              defaultInterfaceState
            ).keys()
          )
        ).toMatchSnapshot();
      }
      {
        const config = await Config.initFromProjectRoot(projectRoot);
        const interfaceState = {
          env: 'production',
          projectType: 'app',
          target: 'browser'
        };
        const ctf = CTF([parcel], interfaceState);
        expect(Array.from(ctf.keys())).toMatchSnapshot();
        const ctfSkillNames = Array.from(
          addMissingDefaultSkillsToCtf({ config }, ctf, interfaceState).keys()
        );
        expect(ctfSkillNames).toMatchSnapshot();
        expect(ctfSkillNames).toContain('parcel');
        expect(ctfSkillNames).not.toContain('rollup');
        expect(ctfSkillNames).not.toContain('webpack');
      }
      {
        const config = await Config.initFromProjectRoot(projectRoot);
        const interfaceState = {
          env: 'production',
          projectType: 'lib',
          target: 'browser'
        };
        const ctf = CTF([parcel], interfaceState);
        expect(Array.from(ctf.keys())).toMatchSnapshot();
        const ctfSkillNames = Array.from(
          addMissingDefaultSkillsToCtf({ config }, ctf, interfaceState).keys()
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
        const project = {
          root: '',
          config: {
            ...defaultProject.config,
            skills: [['@alfred/skill-non-existent-skill', {}]]
          }
        };
        await expect(generateCtfFromProject(project, state)).rejects.toThrow(
          "Cannot find module '@alfred/skill-non-existent-skill' from 'ctf.ts'"
        );
      });

      it('should throw if unsupported skill is used', async () => {
        const [state] = INTERFACE_STATES;
        const project = {
          config: {
            ...defaultProject.config,
            skills: [['@alfred/skill-non-existent-skill', {}]]
          }
        };
        await expect(generateCtfFromProject(project, state)).rejects.toThrow(
          "Cannot find module '@alfred/skill-non-existent-skill' from 'ctf.ts'"
        );
      });
    });

    it('should override core ctf skills that support same interface states', async () => {
      const config = await Config.initFromProjectRoot(projectRoot);
      const interfaceState = {
        env: 'production',
        projectType: 'app',
        target: 'browser'
      };
      const ctf = CTF([parcel], interfaceState);

      expect(Array.from(ctf.keys())).toMatchSnapshot();
      const ctfSkillNames = Array.from(
        addMissingDefaultSkillsToCtf({ config }, ctf, interfaceState).keys()
      );
      expect(ctfSkillNames).toMatchSnapshot();
      expect(ctfSkillNames).toContain('parcel');
      expect(ctfSkillNames).not.toContain('rollup');
      expect(ctfSkillNames).not.toContain('webpack');
    });

    it('should not use CTF skills that do not support current interface state', async () => {
      const config = await Config.initFromProjectRoot(projectRoot);
      const interfaceState = {
        env: 'production',
        projectType: 'lib',
        target: 'browser'
      };
      const ctf = CTF([parcel], interfaceState);
      expect(Array.from(ctf.keys())).toEqual([]);
      const ctfSkillNames = Array.from(
        addMissingDefaultSkillsToCtf({ config }, ctf, interfaceState).keys()
      );
      expect(ctfSkillNames).toMatchSnapshot();
      expect(ctfSkillNames).not.toContain('parcel');
      expect(ctfSkillNames).toContain('rollup');
      expect(ctfSkillNames).not.toContain('webpack');
    });
  });

  describe('dependencies', () => {
    it('should have diffs in deps after learning new skill', async () => {
      const { webpack, babel } = CORE_CTFS;
      const oldCtf = CTF([webpack], defaultInterfaceState);
      const newCtf = CTF([webpack, babel], defaultInterfaceState);
      const ctf = diffCtfDeps(oldCtf, newCtf);
      expect(ctf).toMatchSnapshot();
    });
  });

  // Generate tests for CTF combinations
  const ctfNamesCombinations = powerset(Object.keys(CORE_CTFS)).sort();
  for (const ctfCombination of ctfNamesCombinations) {
    INTERFACE_STATES.forEach(interfaceState => {
      it(`combination ${ctfCombination.join(
        ','
      )} interface state ${JSON.stringify(defaultInterfaceState)}`, () => {
        expect(ctfCombination).toMatchSnapshot();
        // Get the CTFs for each combination
        const ctfObjects = ctfCombination.map(ctfName => CORE_CTFS[ctfName]);
        const result = CTF(ctfObjects, interfaceState);
        expect(
          removePathsPropertiesFromObject(getConfigs(result))
        ).toMatchSnapshot();
        expect(getDependencies(result)).toMatchSnapshot();
        expect(getDevDependencies(result)).toMatchSnapshot();
      });
    });
  }

  INTERFACE_STATES.forEach(interfaceState => {
    it(`should add devDepencencies with interface state ${JSON.stringify(
      interfaceState
    )}`, () => {
      const { devDependencies } = CTF(Object.values(CORE_CTFS), interfaceState)
        .get('webpack')
        .addDevDependencies({
          foobar: '0.0.0'
        });
      expect(devDependencies).toMatchSnapshot();
    });
  });
});