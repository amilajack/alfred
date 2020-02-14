/* eslint no-restricted-syntax: off, import/no-extraneous-dependencies: off, guard-for-in: off, no-param-reassign: off */
import os from 'os';
import path from 'path';
import powerset from '@amilajack/powerset';
import slash from 'slash';
import {
  SkillMap,
  Dependencies,
  ConfigValue,
  ProjectInterface,
  Target
} from '@alfred/types';
import {
  getProjectSubcommands,
  getSkillInterfaceForSubcommand
} from '../src/commands';
import skillMapFromConfig, {
  CORE_SKILLS,
  Skills,
  addSkillHelpers,
  runTransforms
} from '../src/skill';
import { normalizeInterfacesOfSkill } from '../src/interface';
import alfred from '../src';
import { TARGETS } from '../src/constants';

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

function getConfigs(skillMap: SkillMap): Array<ConfigValue> {
  const configsFromMap = Array.from(skillMap.values());
  return configsFromMap
    .flatMap(skill => Array.from(skill?.configs?.values() || []))
    .map(configFile => removePathsPropertiesFromObject(configFile.config));
}

function getDependencies(skillMap: SkillMap): Dependencies {
  return Array.from(skillMap.values())
    .map(skill => skill.dependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
}

function getDevDependencies(skillMap: SkillMap): Dependencies {
  return Array.from(skillMap.values())
    .map(skill => skill.devDependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
}

describe('Skills', () => {
  let defaultProject;

  beforeAll(async () => {
    defaultProject = await alfred(
      path.join(__dirname, '../../cli/tests/fixtures/app')
    );
  });

  describe('transforms', () => {
    it('should run transforms in order', async () => {
      const rawSillMap = new Map([
        [
          'react',
          {
            name: 'react',
            configs: [
              {
                alias: 'eslint',
                filename: '.eslintrc.json',
                config: {
                  plugins: []
                },
                write: false
              }
            ],
            transforms: {
              babel(skill) {
                skill.configs[0].config.plugins.push('a');
                return skill;
              },
              eslint(skill) {
                skill.configs[0].config.plugins.push('b');
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
      const skillMap = await runTransforms(defaultProject, rawSillMap);
      expect(skillMap.get('react').configs[0].config).toEqual({
        plugins: ['a', 'b']
      });
    });

    it.skip('should allow transforms to be async', async () => {
      const rawSillMap = new Map([
        [
          'react',
          {
            name: 'react',
            configs: [
              {
                alias: 'eslint',
                filename: '.eslintrc.json',
                config: {
                  plugins: []
                },
                write: false
              }
            ],
            transforms: {
              async babel(skill) {
                skill.configs[0].config.plugins.push('a');
                return skill;
              },
              async eslint(skill) {
                skill.configs[0].config.plugins.push('b');
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
      const skillMap = await runTransforms(defaultProject, rawSillMap);
      expect(skillMap.get('react').configs[0].config).toEqual({
        plugins: ['a', 'b']
      });
    });

    it('should throw when transforms to not return new skill', async () => {
      const rawSillMap = new Map([
        [
          'react',
          {
            name: 'react',
            files: [
              {
                alias: 'react',
                src: 'boilerplate/root.js',
                dest: 'src/root.js'
              }
            ],
            transforms: {
              eslint() {
                1 + 1;
              }
            }
          }
        ],
        [
          'eslint',
          {
            name: 'eslint'
          }
        ]
      ]);
      return expect(runTransforms(defaultProject, rawSillMap)).rejects.toThrow(
        'Transform from react to eslint must return a new skill'
      );
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
      TARGETS.forEach(target => {
        it(`should get corresponding interface for interface state ${JSON.stringify(
          target
        )}`, async () => {
          const skillMap = await Skills(
            defaultProject,
            target,
            Object.values(CORE_SKILLS)
          );
          expect(
            getSkillInterfaceForSubcommand(skillMap, 'build')
          ).toMatchSnapshot();
        });
      });

      it('should error if subcommand does not exist', async () => {
        for (const target of TARGETS) {
          const skillMap = await Skills(defaultProject, target, [
            CORE_SKILLS.babel
          ]);
          expect(() =>
            getSkillInterfaceForSubcommand(skillMap, 'foo')
          ).toThrow();
        }
      });
    });
  });

  describe('executors', () => {
    it('should generate functions for scripts', async () => {
      for (const target of TARGETS) {
        const skill = await Skills(defaultProject, target, [
          CORE_SKILLS.parcel
        ]);
        expect(
          getProjectSubcommands(defaultProject, skill, target)
        ).toMatchSnapshot();
      }
    });
  });

  describe('helpers', () => {
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

  describe('creation', () => {
    it('should add missing std skills to skill', async () => {
      {
        const target = {
          env: 'production',
          project: 'app',
          platform: 'browser'
        } as Target;
        const skillMap = await Skills(defaultProject, target);
        const skillNames = Array.from(skillMap.keys());
        expect(skillNames).toMatchSnapshot();
        expect(skillNames).toContain('parcel');
        expect(skillNames).not.toContain('rollup');
        expect(skillNames).not.toContain('webpack');
      }
      {
        const target = {
          env: 'production',
          project: 'lib',
          platform: 'browser'
        } as Target;
        const skillMap = await Skills(defaultProject, target);
        const skillNames = Array.from(skillMap.keys());
        expect(skillNames).toMatchSnapshot();
        expect(skillNames).toContain('rollup');
        expect(skillNames).not.toContain('parcel');
        expect(skillNames).not.toContain('webpack');
      }
    });

    it('should throw if skill does not exist', async () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const [state] = TARGETS;
      const project = {
        root: '',
        config: {
          ...defaultProject.config,
          skills: [['@alfred/skill-non-existent-skill', {}]]
        }
      } as ProjectInterface;
      await expect(skillMapFromConfig(project, state)).rejects.toThrow(
        "Cannot find skill module '@alfred/skill-non-existent-skill'"
      );
      spy.mockRestore();
    });

    it('should not return skill map with unsupported skills', async () => {
      const nodeAppTarget = {
        project: 'app',
        platform: 'node',
        env: 'production'
      };
      const project = {
        config: {
          ...defaultProject.config,
          skills: [['@alfred/skill-react', {}]]
        }
      };
      const skillMap = await skillMapFromConfig(project, nodeAppTarget);
      expect(skillMap.has('react')).toBe(false);
    });

    it('should return skill map with unsupported skills when at least one target supports skill', async () => {
      const testProject = await alfred(
        path.join(__dirname, '../../cli/tests/fixtures/app')
      );
      testProject.config = {
        ...testProject.config,
        skills: [['@alfred/skill-react', {}]]
      };
      testProject.targets = [
        {
          project: 'app',
          platform: 'browser',
          env: 'production'
        },
        {
          project: 'app',
          platform: 'browser',
          env: 'production'
        }
      ];
      const skillMap = await testProject.getSkillMap();
      expect(skillMap.has('react')).toBe(true);
    });

    it('should override core skills that support same interface states', async () => {
      const target = {
        env: 'production',
        project: 'app',
        platform: 'browser'
      } as Target;
      const skillMap = await Skills(defaultProject, target);
      const skillNames = Array.from(skillMap.keys());
      expect(skillNames).toMatchSnapshot();
      expect(skillNames).toContain('parcel');
      expect(skillNames).not.toContain('rollup');
      expect(skillNames).not.toContain('webpack');
    });

    it('should remove skills that do not support current interface state', async () => {
      const target = {
        env: 'production',
        project: 'lib',
        platform: 'browser'
      } as Target;
      const skillMap = await Skills(defaultProject, target);
      const skillNames = Array.from(skillMap.keys());
      expect(skillNames).toMatchSnapshot();
      expect(skillNames).toContain('rollup');
      expect(skillNames).not.toContain('parcel');
      expect(skillNames).not.toContain('webpack');
    });
  });

  describe('combinations', () => {
    // Generate all possible combinations of skills
    const skillNamesCombinations = powerset(Object.keys(CORE_SKILLS)).sort();
    for (const skillCombination of skillNamesCombinations) {
      TARGETS.forEach(target => {
        it(`combination ${skillCombination.join(
          ','
        )} interface state ${JSON.stringify(target)}`, async () => {
          // Get the skills for each combination
          const skillsToAdd = skillCombination.map(
            skillName => CORE_SKILLS[skillName]
          );
          const skillMap = await Skills(defaultProject, target, skillsToAdd);
          expect(getConfigs(skillMap)).toMatchSnapshot();
          expect(getDependencies(skillMap)).toMatchSnapshot();
          expect(getDevDependencies(skillMap)).toMatchSnapshot();
        });
      });
    }
  });

  describe('dependencies', () => {
    TARGETS.forEach(target => {
      it(`should add devDepencencies with interface state ${JSON.stringify(
        target
      )}`, async () => {
        const skillMap = await Skills(
          defaultProject,
          target,
          Object.values(CORE_SKILLS)
        );
        const { devDependencies } = skillMap.get('prettier').addDevDeps({
          foobar: '0.0.0'
        });
        expect(devDependencies).toMatchSnapshot();
      });
    });
  });
});
