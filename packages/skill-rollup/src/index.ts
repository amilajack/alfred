import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import { mapEnvToShortName } from '@alfred/helpers';
import {
  RawSkill,
  Skill,
  SkillConfig,
  Env,
  Platform,
  ProjectEnum,
  ConfigValue,
  RunForEachEvent
} from '@alfred/types';
import mergeConfigs from '@alfred/merge-configs';

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
  description: 'Build, optimize, and bundle assets in your app',
  supports,
  interfaces: [
    ['@alfred/interface-build', { supports }],
    ['@alfred/interface-start', { supports }]
  ],
  default: true,
  configs: [
    {
      alias: 'rollup.base',
      filename: 'rollup.base.js',
      config: {
        external(id: string): boolean {
          return id.includes('node_modules');
        }
      }
    },
    {
      alias: 'rollup.prod',
      filename: 'rollup.prod.js',
      config: {
        output: {
          format: 'es'
        },
        plugins: [
          replace({
            'process.env.NODE_ENV': JSON.stringify('production')
          })
        ]
      }
    },
    {
      alias: 'rollup.dev',
      filename: 'rollup.dev.js',
      config: {
        output: {
          format: 'cjs'
        },
        plugins: [
          replace({
            'process.env.NODE_ENV': JSON.stringify('development')
          }),
          commonjs()
        ]
      }
    }
  ],
  hooks: {
    async run({ skill, event }): Promise<void> {
      const { target, subcommand } = event as RunForEachEvent;
      const [baseConfig, prodConfig, devConfig] = [
        'rollup.base',
        'rollup.prod',
        'rollup.dev'
      ].map(
        configAlias => skill.configs.get(configAlias)?.config
      ) as ConfigValue[];
      const inputAndOutputConfigs = {
        input: `./src/lib.${target.platform}.js`,
        output: {
          file: `./targets/${mapEnvToShortName(target.env)}/lib.${
            target.platform
          }.js`
        }
      };
      const prod = mergeConfigs(
        {},
        baseConfig,
        prodConfig,
        inputAndOutputConfigs
      );
      const dev = mergeConfigs(
        {},
        baseConfig,
        devConfig,
        inputAndOutputConfigs
      );

      const rollup = require('rollup');

      switch (subcommand) {
        case 'start': {
          const watchConf = target.env === 'production' ? prod : dev;
          // @TODO: Mention which port and host the server is running (see webpack skill)
          console.log(
            `Starting ${
              target.env === 'production' ? 'optimized' : 'unoptimized'
            } build`
          );
          return rollup.watch({
            ...watchConf.input,
            ...watchConf
          });
        }
        case 'build': {
          console.log(
            `Building ${
              target.env === 'production' ? 'optimized' : 'unoptimized'
            } build`
          );
          const bundle = await rollup.rollup(
            target.env === 'production' ? prod : dev
          );

          return bundle.write(
            (target.env === 'production' ? prod : dev).output
          );
        }
        default:
          throw new Error(`Invalid subcommand: "${subcommand}"`);
      }
    }
  },
  transforms: {
    babel(skill: Skill, { toSkill }): Skill {
      // eslint-disable-next-line import/no-extraneous-dependencies
      const babel = require('rollup-plugin-babel');
      const { config } = toSkill.configs.get('babel') as SkillConfig;
      return skill
        .extendConfig('rollup.base', {
          plugins: [
            babel({
              ...config,
              exclude: 'node_modules/**'
            })
          ]
        })
        .addDepsFromPkg('rollup-plugin-babel');
    }
  }
};

export default skill;
