import path from 'path';
import { openUrlInBrowser } from '@alfred/helpers';
import {
  RawSkill,
  Skill,
  HookArgs,
  RunEvent,
  Env,
  Platform,
  ProjectEnum
} from '@alfred/types/src';

const supports = {
  // Flag name and argument types
  envs: ['production', 'development', 'test'] as Env[],
  // All the supported targets a `build` skill should build
  // @TODO: Add node to targets
  platforms: ['browser', 'node'] as Platform[],
  // Project type
  projects: ['app'] as ProjectEnum[]
};

const skill: RawSkill = {
  name: 'parcel',
  description: 'Build, optimize, and bundle assets in your app',
  interfaces: [
    ['@alfred/interface-build', { supports }],
    ['@alfred/interface-start', { supports }]
  ],
  default: true,
  configs: [
    {
      alias: 'postcss',
      filename: '.postcssrc',
      fileType: 'json',
      config: {
        modules: true,
        plugins: {
          autoprefixer: {
            grid: true
          }
        }
      },
      write: false
    }
  ],
  hooks: {
    async run({ project, event }: HookArgs): Promise<void> {
      const { target, subcommand } = event as RunEvent;
      const { root } = project;
      // eslint-disable-next-line global-require
      const Bundler = require('parcel');
      const src = path.join(root, 'src');

      const entryFiles = [];
      entryFiles.push(
        path.join(src, `${target.project}.${target.platform}.js`)
      );
      if (target.platform === 'browser') {
        entryFiles.push(path.join(src, 'index.html'));
      }

      const parcelOpts = {
        outDir: path.join(root, 'targets', 'prod'),
        outFile: 'index.html',
        cacheDir: path.join(root, 'node_modules', '.cache'),
        minify: target.env === 'production',
        autoInstall: false,
        target: target.platform
      };

      switch (subcommand) {
        case 'start': {
          const server = await new Bundler(entryFiles, {
            ...parcelOpts,
            watch: true
          }).serve();
          const url = `http://localhost:${server.address().port}`;
          console.log(
            `Starting ${
              target.env === 'production' ? 'optimized' : 'unoptimized'
            } build on ${url}`
          );
          // Don't open in browser when running E2E tests
          if (process.env.ALFRED_E2E_TEST !== 'true') {
            await openUrlInBrowser(url);
          }
          return server;
        }
        case 'build': {
          console.log(
            `Building ${
              target.env === 'production' ? 'optimized' : 'unoptimized'
            } build`
          );
          return new Bundler(entryFiles, {
            ...parcelOpts,
            watch: false
          }).bundle();
        }
        default:
          throw new Error(`Invalid subcommand: "${subcommand}"`);
      }
    }
  },
  transforms: {
    react(skill: Skill): Skill {
      return skill
        .setWrite('postcss', true)
        .addDepsFromPkg(['postcss-modules', 'autoprefixer']);
    }
  }
};

export default skill;
