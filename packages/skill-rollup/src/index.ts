import path from 'path';
import {
  configStringify,
  execBinInProject,
  mapEnvToShortName,
  getConfigsBasePath
} from '@alfred/helpers';
import {
  RawSkill,
  Skill,
  SkillConfig,
  Env,
  Platform,
  ProjectEnum,
  RunForEachTargetEvent
} from '@alfred/types';

const supports = {
  // Flag name and argument types
  envs: ['production', 'development', 'test'] as Env[],
  // All the supported targets a `build` skill should build
  platforms: ['browser', 'node'] as Platform[],
  // Project type
  projects: ['lib'] as ProjectEnum[]
};

const skill: RawSkill = {
  name: 'rollup',
  supports,
  tasks: [
    ['@alfred/task-build', { supports }],
    ['@alfred/task-start', { supports }]
  ],
  default: true,
  configs: [
    {
      alias: 'rollup.prod',
      filename: 'rollup.prod.js',
      config: {
        external(id: string): boolean {
          return id.includes('node_modules');
        },
        output: {
          format: 'es'
        },
        plugins: [
          configStringify`replace({
            'process.env.NODE_ENV': JSON.stringify('production')
          })`
        ]
      },
      imports: [`const replace = require('@rollup/plugin-replace');`]
    },
    {
      alias: 'rollup.dev',
      filename: 'rollup.dev.js',
      config: {
        external(id: string): boolean {
          return id.includes('node_modules');
        },
        output: {
          format: 'cjs'
        },
        plugins: [
          configStringify`replace({
            'process.env.NODE_ENV': JSON.stringify('development')
          })`,
          configStringify`commonjs()`
        ]
      },
      imports: [
        `const replace = require('@rollup/plugin-replace');`,
        `const commonjs = require('@rollup/plugin-commonjs');`
      ]
    }
  ],
  hooks: {
    async run({ skill, project, event }): Promise<void> {
      const { target, subcommand } = event as RunForEachTargetEvent;
      const input = `./src/lib.${target.platform}.js`;
      const outFile = `./targets/lib.${target.platform}.${mapEnvToShortName(
        target.env
      )}/index.js`;

      const configPath = path.join(
        getConfigsBasePath(project),
        skill.configs.get(
          target.env === 'production' ? 'rollup.prod' : 'rollup.dev'
        )?.filename as string
      );

      const cmd = `rollup --input ${input} --file ${outFile} --config ${configPath}`;

      switch (subcommand) {
        case 'start': {
          // @TODO: Mention which port and host the server is running (see webpack skill)
          console.log(
            `Starting ${
              target.env === 'production' ? 'optimized' : 'unoptimized'
            } build`
          );
          execBinInProject(project, `${cmd} --watch`);
          break;
        }
        case 'build': {
          console.log(
            `Building ${
              target.env === 'production' ? 'optimized' : 'unoptimized'
            } build`
          );
          execBinInProject(project, cmd);
          break;
        }
        default:
          throw new Error(`Invalid subcommand: "${subcommand}"`);
      }
    }
  },
  transforms: {
    babel(skill: Skill, { toSkill }): Skill {
      // eslint-disable-next-line import/no-extraneous-dependencies
      const { config } = toSkill.configs.get('babel') as SkillConfig;
      const babelConfig = JSON.stringify({
        ...config,
        exclude: 'node_modules/**'
      }).replace(/"/g, `'`);

      return skill
        .extendConfig('rollup.dev', {
          plugins: [configStringify(`babel(${babelConfig})`)]
        })
        .addImports('rollup.dev', [
          'const babel = require("rollup-plugin-babel");'
        ])
        .extendConfig('rollup.prod', {
          plugins: [configStringify(`babel(${babelConfig})`)]
        })
        .addImports('rollup.prod', [
          'const babel = require("rollup-plugin-babel");'
        ])
        .addDepsFromPkg('rollup-plugin-babel');
    }
  }
};

export default skill;
