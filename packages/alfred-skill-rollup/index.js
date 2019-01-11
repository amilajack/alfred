const replace = require('rollup-plugin-replace');
const {
  getConfigPathByConfigName,
  getPkgBinPath,
  execCommand
} = require('@alfredpkg/core');

module.exports = {
  name: 'rollup',
  description: 'Build, optimize, and bundle assets in your app',
  interface: '@alfredpkg/interface-build',
  interfaceConfig: {
    supports: {
      // Flag name and argument types
      env: ['production', 'development', 'test'],
      // All the supported targets a `build` skill should build
      targets: ['browser', 'node'],
      // Project type
      projectTypes: ['lib']
    }
  },
  devDependencies: { rollup: '4.28.3', 'rollup-plugin-replace': '2.1.0' },
  configFiles: [
    {
      name: 'rollup.base',
      path: 'rollup.config.js',
      config: {
        entry:
          process.env.NODE_ENV === 'production'
            ? './src/index.tsx'
            : './src/graph/viz-worker.worker.js',
        output: {
          format: 'es'
        },
        dest: 'targets/lib.js',
        plugins: [
          replace({
            DEBUG: false,
            'process.env.NODE_ENV': JSON.stringify('production')
          })
        ],
        external(id) {
          return id.includes('node_modules');
        }
      }
    }
  ],
  hooks: {
    async call(configFiles, ctf, alfredConfig, state) {
      const configPath = getConfigPathByConfigName('rollup.base', configFiles);
      const binPath = await getPkgBinPath('rollup', 'rollup');
      const filename = [state.projectType, state.target, 'js'].join('.');
      const cmd =
        state.env === 'production'
          ? `./src/${filename} --format esm --file ./targets/${filename}`
          : `./src/${filename} --format umd --name "myBundle" --file ./targets/${filename}`;
      return execCommand(
        [
          binPath,
          cmd,
          alfredConfig.showConfigs ? `--config ${configPath} .` : ''
        ].join(' ')
      );
    }
  }
};
