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
  Target,
  RawSkill
} from '@alfred/types';
import { getSubcommandMap } from '../src/commands';
import skillMapFromConfig, {
  Skills,
  addSkillHelpers,
  runTransforms,
  CORE_SKILLS
} from '../src/skill';
import { getSubcommandTasksMap, normalizeTasksOfSkill } from '../src/task';
import alfred from '../src';
import { TARGETS } from '../src/constants';

function removePathsPropertiesFromObject(
  obj:
    | Array<any>
    | {
        [property: string]: string | Record<string, any>;
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
    .map(config => removePathsPropertiesFromObject(config.config));
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
  let defaultAppProject;
  let defaultLibProject;
  let defaultMultiPlatformsProject;

  beforeAll(async () => {
    defaultAppProject = await alfred(
      path.join(__dirname, '../../cli/tests/fixtures/app')
    );
    defaultLibProject = await alfred(
      path.join(__dirname, '../../cli/tests/fixtures/library')
    );
    defaultMultiPlatformsProject = await alfred(
      path.join(__dirname, '../../cli/tests/fixtures/configs-dir')
    );
  });

  describe('transforms', () => {
    it('should run transforms in order', async () => {
      const rawSillMap = new Map<string, RawSkill>([
        [
          'react',
          {
            name: 'react',
            configs: [
              {
                alias: 'eslint',
                filename: '.eslintrc.js',
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
      const skillMap = await runTransforms(defaultAppProject, rawSillMap);
      expect(skillMap.get('react').configs[0].config).toEqual({
        plugins: ['a', 'b']
      });
    });

    it.skip('should allow transforms to be async', async () => {
      const rawSillMap = new Map<string, RawSkill>([
        [
          'react',
          {
            name: 'react',
            configs: [
              {
                alias: 'eslint',
                filename: '.eslintrc.js',
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
      const skillMap = await runTransforms(defaultAppProject, rawSillMap);
      expect(skillMap.get('react').configs[0].config).toEqual({
        plugins: ['a', 'b']
      });
    });

    it('should throw when transforms to not return new skill', async () => {
      const rawSillMap = new Map<string, RawSkill>([
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
      return expect(
        runTransforms(defaultAppProject, rawSillMap)
      ).rejects.toThrow(
        'Transform from react to eslint must return a new skill'
      );
    });
  });

  describe('tasks', () => {
    it('should allow falsy inputs', () => {
      expect(normalizeTasksOfSkill(undefined)).toEqual([]);
      expect(normalizeTasksOfSkill(undefined)).toEqual([]);
    });

    it('should allow array of strings input', () => {
      expect(normalizeTasksOfSkill(['@alfred/task-build'])).toMatchSnapshot();
      expect(
        normalizeTasksOfSkill(['@alfred/task-build', '@alfred/task-start'])
      ).toMatchSnapshot();
    });

    it('should not allow non-array or string inputs', () => {
      expect(() =>
        normalizeTasksOfSkill({
          '@alfred/task-build': {},
          '@alfred/task-start': {}
        })
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        normalizeTasksOfSkill('incorrect-input')
      ).toThrowErrorMatchingSnapshot();
    });

    describe('subcommand', () => {
      TARGETS.forEach(target => {
        it(`should get corresponding task for target ${JSON.stringify(
          target
        )}`, async () => {
          const skillMap = await Skills(
            defaultAppProject,
            Object.values(CORE_SKILLS),
            target
          );
          expect(
            getSubcommandTasksMap(skillMap).get('build')
          ).toMatchSnapshot();
        });
      });

      it('should error if subcommand does not exist', async () => {
        for (const target of TARGETS) {
          const skillMap = await Skills(
            defaultAppProject,
            [CORE_SKILLS.babel],
            target
          );
          expect(getSubcommandTasksMap(skillMap).get('foo')).toBe(undefined);
        }
      });
    });
  });

  describe('executors', () => {
    it('should generate functions for scripts', async () => {
      for (const target of TARGETS) {
        const skill = await Skills(
          defaultAppProject,
          [CORE_SKILLS.parcel],
          target
        );
        expect(getSubcommandMap(defaultAppProject, skill)).toMatchSnapshot();
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
        const skillMap = await Skills(defaultAppProject, [], target);
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
        const skillMap = await Skills(defaultLibProject, [], target);
        const skillNames = Array.from(skillMap.keys());
        expect(skillNames).toMatchSnapshot();
        expect(skillNames).toContain('rollup');
        expect(skillNames).not.toContain('parcel');
        expect(skillNames).not.toContain('webpack');
      }
      {
        const skillMap = await Skills(defaultMultiPlatformsProject);
        const skillNames = Array.from(skillMap.keys());
        expect(skillNames).toMatchSnapshot();
        expect(skillNames).toContain('rollup');
        expect(skillNames).toContain('parcel');
      }
    });

    it('should throw if runForEachTarget is set and transforms is not passed', async () => {
      const run = jest.fn();
      const skill: RawSkill = {
        name: 'test-skill',
        tasks: [
          {
            name: 'some-test-task',
            module: {
              subcommand: 'test-command',
              runForEachTarget: true,
              resolveSkill(skills, target) {
                return skills.find(skill => skill.name === 'test-skill');
              }
            },
            config: {}
          }
        ],
        hooks: {
          run
        }
      };
      const skillMap = await Skills(defaultMultiPlatformsProject, [skill]);
      const subcommandMap = getSubcommandMap(
        defaultMultiPlatformsProject,
        skillMap
      );
      await Promise.all(
        defaultMultiPlatformsProject.targets.map(target => {
          return subcommandMap.get('test-command')([], target);
        })
      );
      expect(run).toHaveBeenCalledTimes(3);
    });

    it('should throw if either runForEachTarget or target are falsy', async () => {
      const run = jest.fn();
      const skill: RawSkill = {
        name: 'test-skill',
        tasks: [
          {
            name: 'some-test-task',
            module: {
              subcommand: 'test-command',
              runForEachTarget: true,
              resolveSkill(skills) {
                return skills[0];
              }
            },
            config: {}
          }
        ],
        hooks: {
          run
        }
      };
      const skillMap = await Skills(defaultMultiPlatformsProject, [skill]);
      const subcommandMap = getSubcommandMap(
        defaultMultiPlatformsProject,
        skillMap
      );
      const subcommandRunFn = subcommandMap.get('test-command');
      await expect(subcommandRunFn([])).rejects.toThrow(
        'Target and runForEachTarget must both be defined together'
      );
      expect(run).toHaveBeenCalledTimes(0);
    });

    it('should throw if skill does not exist', async () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const project = {
        root: '',
        config: {
          ...defaultAppProject.config,
          skills: [['@alfred/skill-non-existent-skill', {}]]
        }
      } as ProjectInterface;
      await expect(skillMapFromConfig(project)).rejects.toThrow(
        "Cannot find module '@alfred/skill-non-existent-skill'"
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
        ...defaultAppProject,
        emitAsync: jest.fn(),
        emit: jest.fn(),
        config: {
          ...defaultAppProject.config,
          skills: [['@alfred/skill-react', {}]]
        },
        targets: [nodeAppTarget]
      };
      const skillMap = await skillMapFromConfig(project);
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
      expect(skillMap.has('eslint')).toBe(true);
    });

    it('should override core skills that support same target', async () => {
      const target = {
        env: 'production',
        project: 'app',
        platform: 'browser'
      } as Target;
      const skillMap = await Skills(defaultAppProject, [], target);
      const skillNames = Array.from(skillMap.keys());
      expect(skillNames).toMatchSnapshot();
      expect(skillNames).toContain('parcel');
      expect(skillNames).not.toContain('rollup');
      expect(skillNames).not.toContain('webpack');
    });

    it('should remove skills that do not support current target', async () => {
      const target = {
        env: 'production',
        project: 'lib',
        platform: 'browser'
      } as Target;
      const skillMap = await Skills(defaultAppProject, [], target);
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
        it(`combination ${skillCombination.join(',')} target ${JSON.stringify(
          target
        )}`, async () => {
          // Get the skills for each combination
          const skillsToAdd = skillCombination.map(
            skillName => CORE_SKILLS[skillName]
          );
          const skillMap = await Skills(defaultAppProject, skillsToAdd, target);
          expect(getConfigs(skillMap)).toMatchSnapshot();
          expect(getDependencies(skillMap)).toMatchSnapshot();
          expect(getDevDependencies(skillMap)).toMatchSnapshot();
        });
      });
    }
  });

  describe('dependencies', () => {
    TARGETS.forEach(target => {
      it(`should add devDepencencies with target ${JSON.stringify(
        target
      )}`, async () => {
        const skillMap = await Skills(
          defaultAppProject,
          Object.values(CORE_SKILLS),
          target
        );
        const { devDependencies } = skillMap.get('prettier').addDevDeps({
          foobar: '0.0.0'
        });
        expect(devDependencies).toMatchSnapshot();
      });
    });
  });
});
