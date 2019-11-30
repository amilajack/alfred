const path = require('path');
const { openInBrowser } = require('@alfred/helpers');

const interfaceConfig = {
  supports: {
    // Flag name and argument types
    env: ['production', 'development', 'test'],
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
  devDependencies: {
    parcel: '^1.11.0'
  },
  configFiles: [],
  hooks: {
    async call({ interfaceState, alfredConfig, subcommand }) {
      const Bundler = require('parcel');
      const src = path.join(alfredConfig.root, 'src');
      const entryFiles = [];
      if (interfaceState.target === 'browser') {
        entryFiles.push(path.join(src, 'index.html'));
      } else if (interfaceState.target === 'node') {
        entryFiles.push(path.join(src, 'app.node.js'));
      }
      const { target } = interfaceState;
      const baseOptions = {
        outDir: path.join(alfredConfig.root, 'targets', 'prod'),
        outFile: 'index.html',
        cacheDir: path.join(alfredConfig.root, 'node_modules', '.cache'),
        minify: interfaceState.env === 'production',
        autoInstall: false,
        target
      };

      switch (subcommand) {
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
            await openInBrowser(url);
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
          throw new Error(`Invalid subcommand: "${subcommand}"`);
      }
    }
  }
};
