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
  interfaces: ['@alfredpkg/interface-test'],
  devDependencies: { jest: '5.0.0' },
  configFiles: [
    {
      name: 'jest',
      path: 'jest.config.js',
      write: true,
      config: {}
    }
  ],
  hooks: {
    async call(configFiles, ctf, alfredConfig) {
      const configPath = getConfigPathByConfigName('jest', configFiles);
      const binPath = await getPkgBinPath('jest-cli', 'jest');
      // @TODO Create a hidden `./node_modules/.alfred` directory to put configs in
      const jestTransformerPath = path.join(
        alfredConfig.root,
        'node_modules',
        'jest-transformer.js'
      );
      const babelConfig = JSON.stringify(
        getConfigByConfigName('babel', ctf.get('babel').configFiles).config
      );
      const hiddenTmpConfigPath = path.join(
        alfredConfig.root,
        'node_modules',
        'jest.config.js'
      );
      await fs.promises.writeFile(
        // @TODO Write to ./node_modules/.alfred
        alfredConfig.showConfigs ? configPath : hiddenTmpConfigPath,
        `module.exports = {
          transform: {
            '^.+.jsx?$': '${jestTransformerPath}'
          },
          rootDir: '${alfredConfig.root}'
        };
        `
      );
      await fs.promises.writeFile(
        jestTransformerPath,
        `const babelJestTransform = require('babel-jest');
        module.exports = babelJestTransform.createTransformer(${babelConfig});`
      );

      return execCommand(
        [
          binPath,
          alfredConfig.showConfigs
            ? `--config ${configPath} ${alfredConfig.root}`
            : `--config ${hiddenTmpConfigPath} ${alfredConfig.root}`
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
