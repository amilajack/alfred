/* eslint no-restricted-syntax: off, import/no-extraneous-dependencies: off, guard-for-in: off, no-param-reassign: off */
import os from 'os';
import path from 'path';
import powerset from '@amilajack/powerset';
import slash from 'slash';
import {
  InterfaceState,
  SkillMap,
  Dependencies,
  ConfigValue
} from '@alfred/types';
import {
  getExecutableWrittenConfigsMethods,
  getInterfaceForSubcommand
} from '../src/commands';
import skillMapFromConfig, {
  CORE_SKILLS,
  Skills,
  addSkillHelpers,
  runTransforms
} from '../src/skill';
import { normalizeInterfacesOfSkill, INTERFACE_STATES } from '../src/interface';
import Project from '../src/project';

function getConfigs(skillMap: SkillMap): Array<ConfigValue> {
  return Array.from(skillMap.values())
    .map(skill => skill.configFiles || [])
    .flat()
    .map(configFile => configFile.config);
}

function getDependencies(skillMap: SkillMap): Dependencies {
  return Array.from(skillMap.values())
    .map(skillNode => skillNode.dependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
}

function getDevDependencies(skillMap: SkillMap): Dependencies {
  return Array.from(skillMap.values())
    .map(skillNode => skillNode.devDependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
}

const parcel = require('@alfred/skill-parcel');

const [defaultInterfaceState] = INTERFACE_STATES;

const defaultProject = new Project(
  path.join(__dirname, '../../cli/tests/fixtures/app')
);

function removePathsPropertiesFromObject(
  obj:
    | Array<any>
    | {
        [x: string]: string | Record<string, any>;
      }
): Record<string, any> {
  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'object') {
      removePathsPropertiesFromObject(value);
    }

    if (typeof value === 'string') {
      if (value.includes(os.homedir()) || value[0] === '/') {
        obj[key] = '/';
      }
      if (obj[key].includes('\\')) {
        obj[key] = slash(obj[key]);
      }
    }
  }
  return obj;
}

describe('Skills', () => {
  describe('order', () => {
    it('should run transforms in order', () => {
      const skillMap = new Map([
        [
          'react',
          {
            name: 'react',
            configFiles: [
              {
                name: 'eslint',
                path: '.eslintrc.json',
                write: true,
                config: {
                  plugins: []
                }
              }
            ],
            transforms: {
              babel(skill) {
                skill.configFiles[0].config.plugins.push('a');
                return skill;
              },
              eslint(skill) {
                skill.configFiles[0].config.plugins.push('b');
                return skill;
              }
            }
          }
        ],
        [
          'eslint',
          {
            name: 'eslint'
          }
        ],
        [
          'babel',
          {
            name: 'babel'
          }
        ]
      ]);
      expect(
        runTransforms(defaultProject, skillMap).get('react').configFiles[0]
          .config
      ).toEqual({
        plugins: ['a', 'b']
      });
    });
  });

  describe('interfaces', () => {
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
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        normalizeInterfacesOfSkill('incorrect-input')
      ).toThrowErrorMatchingSnapshot();
    });

    describe('subcommand', () => {
      INTERFACE_STATES.forEach(interfaceState => {
        it(`should get corresponding interface for interface state ${JSON.stringify(
          interfaceState
        )}`, () => {
          expect(
            getInterfaceForSubcommand(
              Skills(
                defaultProject,
                Object.values(CORE_SKILLS),
                interfaceState
              ),
              'build'
            )
          ).toMatchSnapshot();
        });
      });

      it('should error if subcommand does not exist', () => {
        INTERFACE_STATES.forEach(interfaceState => {
          expect(() =>
            getInterfaceForSubcommand(
              Skills(defaultProject, [CORE_SKILLS.babel], interfaceState),
              'foo'
            )
          ).toThrow();
        });
      });
    });
  });

  describe('executors', () => {
    it('should generate functions for scripts', () => {
      INTERFACE_STATES.forEach(interfaceState => {
        const skill = Skills(
          defaultProject,
          [CORE_SKILLS.parcel],
          interfaceState
        );
        expect(
          getExecutableWrittenConfigsMethods(
            defaultProject,
            skill,
            interfaceState
          )
        ).toMatchSnapshot();
      });
    });
  });

  describe('skill helpers', () => {
    describe('adding deps from pkg', () => {
      const defaultPkg = {
        devDependencies: {
          foo: '1.1.1'
        }
      };
      it('should add deps from pkg', () => {
        expect(
          addSkillHelpers(CORE_SKILLS.babel).addDepsFromPkg('foo', defaultPkg)
        ).toHaveProperty('devDependencies');
        expect(
          addSkillHelpers(CORE_SKILLS.babel).addDepsFromPkg('foo', defaultPkg)
            .devDependencies
        ).toHaveProperty('foo', '1.1.1');
      });

      it('should support different deps types', () => {
        const pkg = {
          peerDependencies: {
            foo: '1.1.1'
          }
        };
        expect(
          addSkillHelpers(CORE_SKILLS.babel).addDepsFromPkg('foo', pkg, 'peer')
        ).toHaveProperty('devDependencies');
        expect(
          addSkillHelpers(CORE_SKILLS.babel).addDepsFromPkg('foo', pkg, 'peer')
            .devDependencies
        ).toHaveProperty('foo', '1.1.1');
        expect(
          addSkillHelpers(CORE_SKILLS.babel).addDepsFromPkg(
            'foo',
            defaultPkg,
            'dev',
            'peer'
          )
        ).toHaveProperty('peerDependencies');
        expect(
          addSkillHelpers(CORE_SKILLS.babel).addDepsFromPkg(
            'foo',
            defaultPkg,
            'dev',
            'peer'
          ).peerDependencies
        ).toHaveProperty('foo', '1.1.1');
      });

      it('should throw on unresolved pkg', () => {
        expect(() =>
          addSkillHelpers(CORE_SKILLS.babel).addDepsFromPkg('foo', {})
        ).toThrow(
          'Package "foo" does not exist in devDependencies of skill package.json'
        );
      });
    });
  });

  describe('alfred cli helpers', () => {
    it('should add missing std skills to skill', async () => {
      {
        const interfaceState = {
          env: 'production',
          projectType: 'app',
          target: 'browser'
        } as InterfaceState;
        const skillMap = Skills(defaultProject, [parcel], interfaceState);
        const skillNames = Array.from(skillMap.keys());
        expect(skillNames).toMatchSnapshot();
        expect(skillNames).toContain('parcel');
        expect(skillNames).not.toContain('rollup');
        expect(skillNames).not.toContain('webpack');
      }
      {
        const interfaceState = {
          env: 'production',
          projectType: 'lib',
          target: 'browser'
        } as InterfaceState;
        const skillMap = Skills(defaultProject, [parcel], interfaceState);
        const skillNames = Array.from(skillMap.keys());
        expect(skillNames).toMatchSnapshot();
        expect(skillNames).toContain('rollup');
        expect(skillNames).not.toContain('parcel');
        expect(skillNames).not.toContain('webpack');
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
        await expect(
          skillMapFromConfig(project, state, project.config)
        ).rejects.toThrow(
          "Cannot find module '@alfred/skill-non-existent-skill' from 'index.js'"
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
        await expect(
          skillMapFromConfig(project, state, project.config)
        ).rejects.toThrow(
          "Cannot find module '@alfred/skill-non-existent-skill' from 'index.js'"
        );
      });
    });

    it('should override core skills that support same interface states', async () => {
      const interfaceState = {
        env: 'production',
        projectType: 'app',
        target: 'browser'
      } as InterfaceState;
      const skillMap = Skills(defaultProject, [parcel], interfaceState);
      const skillNames = Array.from(skillMap.keys());
      expect(skillNames).toMatchSnapshot();
      expect(skillNames).toContain('parcel');
      expect(skillNames).not.toContain('rollup');
      expect(skillNames).not.toContain('webpack');
    });

    it('should not use skills that do not support current interface state', async () => {
      const interfaceState = {
        env: 'production',
        projectType: 'lib',
        target: 'browser'
      } as InterfaceState;
      const skillMap = Skills(defaultProject, [parcel], interfaceState);
      const skillNames = Array.from(skillMap.keys());
      expect(skillNames).toMatchSnapshot();
      expect(skillNames).not.toContain('parcel');
      expect(skillNames).toContain('rollup');
      expect(skillNames).not.toContain('webpack');
    });
  });

  // Generate tests for skill combinations
  const skillNamesCombinations = powerset(Object.keys(CORE_SKILLS)).sort();
  for (const skillCombination of skillNamesCombinations) {
    INTERFACE_STATES.forEach(interfaceState => {
      it(`combination ${skillCombination.join(
        ','
      )} interface state ${JSON.stringify(defaultInterfaceState)}`, () => {
        expect(skillCombination).toMatchSnapshot();
        // Get the skills for each combination
        const skillObjects = skillCombination.map(
          skillName => CORE_SKILLS[skillName]
        );
        const SkillMap = Skills(defaultProject, skillObjects, interfaceState);
        expect(
          removePathsPropertiesFromObject(getConfigs(SkillMap))
        ).toMatchSnapshot();
        expect(getDependencies(SkillMap)).toMatchSnapshot();
        expect(getDevDependencies(SkillMap)).toMatchSnapshot();
      });
    });
  }

  INTERFACE_STATES.forEach(interfaceState => {
    it(`should add devDepencencies with interface state ${JSON.stringify(
      interfaceState
    )}`, () => {
      const { devDependencies } = Skills(
        defaultProject,
        Object.values(CORE_SKILLS),
        interfaceState
      )
        .get('parcel')
        .addDevDeps({
          foobar: '0.0.0'
        });
      expect(devDependencies).toMatchSnapshot();
    });
  });
});
