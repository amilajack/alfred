const path = require('path');
const { openInBrowser } = require('@alfredpkg/helpers');

const interfaceConfig = {
  supports: {
    // Flag name and argument types
    env: ['production', 'development', 'test'],
    // All the supported targets a `build` skill should build
    targets: ['browser', 'node'],
    // Project type
    projectTypes: ['app']
  }
};

module.exports = {
  name: 'parcel',
  description: 'Build, optimize, and bundle assets in your app',
  interfaces: [
    ['@alfredpkg/interface-build', interfaceConfig],
    ['@alfredpkg/interface-start', interfaceConfig]
  ],
  devDependencies: {
    parcel: '^1.11.0'
  },
  configFiles: [],
  hooks: {
    async call({ alfredConfig, interfaceState, subcommand }) {
      const Bundler = require('parcel');
      const src = path.join(alfredConfig.root, 'src');
      const entryFiles = [];
      if (interfaceState.target === 'browser') {
        entryFiles.push(path.join(src, 'index.html'));
      }
      if (interfaceState.target === 'node') {
        entryFiles.push(path.join(src, 'app.node.js'));
      }
      const { target } = interfaceState;
      const baseOptions = {
        outDir: path.join(alfredConfig.root, 'targets', 'prod'),
        outFile: 'index.html',
        cacheDir: path.join(alfredConfig.root, 'node_modules', '.cache'),
        minify: interfaceState.env === 'production',
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
              interfaceState.env !== 'production' ? 'unoptimized' : 'optimized'
            } build on ${url}...`
          );
          await openInBrowser(url);
          return server;
        }
        case 'build': {
          console.log(
            `Building ${
              interfaceState.env !== 'production' ? 'unoptimized' : 'optimized'
            } build...`
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
