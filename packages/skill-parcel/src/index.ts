import path from 'path';
import { openUrlInBrowser } from '@alfred/helpers';
import {
  RawSkill,
  Skill,
  RunForEachTargetEvent,
  Env,
  Platform,
  ProjectEnum
} from '@alfred/types';

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
  tasks: [
    ['@alfred/task-build', { supports }],
    ['@alfred/task-start', { supports }]
  ],
  default: true,
  configs: [
    {
      alias: 'postcss',
      filename: '.postcssrc',
      pkgProperty: 'postcss',
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
    async run({ project, event }): Promise<void> {
      const {
        target,
        subcommand,
        parsedFlags,
        output
      } = event as RunForEachTargetEvent;
      const { root } = project;
      // eslint-disable-next-line global-require
      const Bundler = require('parcel');
      const src = path.join(root, 'src');

      const entryFiles = [];
      if (target.platform === 'browser') {
        entryFiles.push(path.join(src, 'index.html'));
      } else {
        entryFiles.push(
          path.join(src, `${target.project}.${target.platform}.js`)
        );
      }

      const parcelOpts = {
        outDir: output,
        outFile: 'index.html',
        cacheDir: path.join(root, 'node_modules', '.cache'),
        minify: target.env === 'production',
        autoInstall: false,
        target: target.platform,
        ...parsedFlags
      };

      switch (subcommand) {
        case 'start': {
          const bundler = new Bundler(entryFiles, {
            ...parcelOpts,
            watch: true
          });
          const server =
            'port' in parcelOpts
              ? // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                await bundler.serve(parcelOpts.port)
              : await bundler.serve();
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
