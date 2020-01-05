const fs = require('fs');
const path = require('path');
const { execCommand, getPkgBinPath } = require('@alfred/helpers');
const {
  getConfigPathByConfigName,
  getConfigByConfigName
} = require('@alfred/helpers');

module.exports = {
  name: 'jest',
  description: 'Test your JS files',
  interfaces: ['@alfred/interface-test'],
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
    async call({ configFiles, ctf, config, alfredConfig, flags }) {
      const configPath = getConfigPathByConfigName('jest', configFiles);
      const binPath = await getPkgBinPath('jest-cli', 'jest');
      const { root } = config;
      const nodeModulesPath = path.join(root, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        await fs.promises.mkdir(nodeModulesPath);
      }
      // @TODO Create a hidden `./node_modules/.alfred` directory to put configs in
      const jestTransformerPath = path.join(
        root,
        'node_modules',
        'jest-transformer.js'
      );
      const babelConfig = JSON.stringify(
        getConfigByConfigName('babel', ctf.get('babel').configFiles).config
      );
      const hiddenTmpConfigPath = path.join(
        root,
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
          rootDir: '${root}'
        };
        `
      );
      const babelJestPath = require.resolve('./babel-jest');
      await fs.promises.writeFile(
        jestTransformerPath,
        `const babelJestTransform = require('${babelJestPath}');
        module.exports = babelJestTransform.createTransformer(${babelConfig});`
      );

      return execCommand(
        [
          binPath,
          alfredConfig.showConfigs
            ? `--config ${configPath} ${root}`
            : `--config ${hiddenTmpConfigPath} ${root}`,
          ...flags
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
        })
    // This causes a cycle in the CTF graph, does not allow topsort
    // babel: config =>
    //   config.addDependencies({
    //     'babel-core': '^7.0.0-bridge.0'
    //   })
  }
};
