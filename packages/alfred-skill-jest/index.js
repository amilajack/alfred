const fs = require('fs');
const path = require('path');
const {
  getConfigPathByConfigName,
  getConfigByConfigName,
  getPkgBinPath,
  execCommand
} = require('@alfredpkg/core');

module.exports = {
  name: 'jest',
  description: 'Test your JS files',
  interface: '@alfredpkg/interface-test',
  devDependencies: { jest: '5.0.0' },
  configFiles: [
    {
      name: 'jest',
      path: 'jest.config.js',
      config: {}
    }
  ],
  hooks: {
    async call(configFiles, ctf, alfredConfig) {
      const configPath = getConfigPathByConfigName('jest', configFiles);
      const binPath = await getPkgBinPath('jest-cli', 'jest');
      // @TODO Create a hidden `./node_modules/.alfred` directory to put configs in
      const jestTransformerPath = path.join(
        process.cwd(),
        'node_modules',
        'jest-transformer.js'
      );
      const config = JSON.stringify({
        presets: getConfigByConfigName('babel', ctf.get('babel').configFiles)
          .config.presets
      });
      const hiddenTmpConfigPath = path.join(
        process.cwd(),
        'node_modules',
        'jest.config.js'
      );
      await fs.promises.writeFile(
        // @TODO Write to ./node_modules/.alfred
        hiddenTmpConfigPath,
        `module.exports = {
          transform: {
            '^.+.jsx?$': './node_modules/jest-transformer.js'
          },
          rootDir: '..'
        };
        `
      );
      await fs.promises.writeFile(
        jestTransformerPath,
        `const foo = require('babel-jest');
        module.exports = foo.createTransformer(${config});`
      );

      return execCommand(
        [
          binPath,
          alfredConfig.showConfigs
            ? `--config ${configPath} ${process.cwd()}`
            : `--config ${hiddenTmpConfigPath} ${process.cwd()}`
        ].join(' ')
      );
    }
  },
  ctfs: {
    eslint: config =>
      config
        .addDevDependencies({
          'eslint-plugin-jest': '8.0.0'
        })
        .extendConfig('eslint', {
          plugins: ['jest']
        }),
    babel: config =>
      config.addDependencies({
        'babel-core': '^7.0.0-bridge.0'
      })
  }
};
