const path = require('path');
const { openUrlInBrowser } = require('@alfred/helpers');

const interfaceConfig = {
  supports: {
    // Flag name and argument types
    envs: ['production', 'development', 'test'],
    // All the supported targets a `build` skill should build
    // @TODO: Add node to targets
    targets: ['browser'],
    // Project type
    projectTypes: ['app']
  }
};

module.exports = {
  name: 'parcel',
  description: 'Build, optimize, and bundle assets in your app',
  interfaces: [
    ['@alfred/interface-build', interfaceConfig],
    ['@alfred/interface-start', interfaceConfig]
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
    async run({ project, data }) {
      const { interfaceState } = data;
      const { root } = project;
      // eslint-disable-next-line global-require
      const Bundler = require('parcel');
      const src = path.join(root, 'src');

      const entryFiles = [];
      entryFiles.push(
        path.join(
          src,
          `${interfaceState.projectType}.${interfaceState.target}.js`
        )
      );
      if (interfaceState.target === 'browser') {
        entryFiles.push(path.join(src, 'index.html'));
      }

      const { target } = interfaceState;
      const baseOptions = {
        outDir: path.join(root, 'targets', 'prod'),
        outFile: 'index.html',
        cacheDir: path.join(root, 'node_modules', '.cache'),
        minify: interfaceState.env === 'production',
        autoInstall: false,
        target
      };

      switch (data.subcommand) {
        case 'start': {
          const server = await new Bundler(entryFiles, {
            ...baseOptions,
            watch: true
          }).serve();
          const url = `http://localhost:${server.address().port}`;
          console.log(
            `Starting ${
              interfaceState.env === 'production' ? 'optimized' : 'unoptimized'
            } build on ${url}`
          );
          // Don't open in browser when running E2E tests
          if (
            !('ALFRED_E2E_TEST' in process.env) ||
            process.env.ALFRED_E2E_TEST !== 'true'
          ) {
            await openUrlInBrowser(url);
          }
          return server;
        }
        case 'build': {
          console.log(
            `Building ${
              interfaceState.env === 'production' ? 'optimized' : 'unoptimized'
            } build`
          );
          return new Bundler(entryFiles, {
            ...baseOptions,
            watch: false
          }).bundle();
        }
        default:
          throw new Error(`Invalid subcommand: "${data.subcommand}"`);
      }
    }
  },
  transforms: {
    react(skill) {
      return skill
        .setWrite('postcss', true)
        .addDepsFromPkg(['postcss-modules', 'autoprefixer']);
    }
  }
};
