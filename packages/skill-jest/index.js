const fs = require('fs');
const path = require('path');
const { execCmdInProject, getPkgBinPath } = require('@alfred/helpers');
const {
  getConfigPathByConfigName,
  getConfigByName
} = require('@alfred/helpers');

module.exports = {
  name: 'jest',
  description: 'Test your JS files',
  interfaces: ['@alfred/interface-test'],
  configFiles: [
    {
      name: 'jest',
      path: 'jest.config.js',
      configType: 'module',
      write: true,
      config: {}
    }
  ],
  hooks: {
    async call({ configFiles, skillMap, config, project, flags }) {
      const configPath = getConfigPathByConfigName('jest', configFiles);
      const binPath = await getPkgBinPath('jest-cli', 'jest');
      const { root } = project;
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
        getConfigByName('babel', skillMap.get('babel').configFiles).config
      );
      const hiddenTmpConfigPath = path.join(
        root,
        'node_modules',
        'jest.config.js'
      );
      await fs.promises.writeFile(
        // @TODO Write to ./node_modules/.alfred
        config.showConfigs ? configPath : hiddenTmpConfigPath,
        `module.exports = {
          transform: {
            '^.+.jsx?$': '${jestTransformerPath}'
          },
          rootDir: '${root}'
        };
        `
      );
      if (!config.showConfigs && fs.existsSync(configPath)) {
        await fs.promises.unlink(configPath);
      }
      const babelJestPath = require.resolve('./babel-jest');
      await fs.promises.writeFile(
        jestTransformerPath,
        `const babelJestTransform = require('${babelJestPath}');
        module.exports = babelJestTransform.createTransformer(${babelConfig});`
      );

      return execCmdInProject(
        project,
        [
          binPath,
          config.showConfigs
            ? `--config ${configPath} ${root}`
            : `--config ${hiddenTmpConfigPath} ${root}`,
          ...flags
        ].join(' ')
      );
    }
  },
  transforms: {
    babel(skill) {
      return skill.extendConfig('jest', {
        transform: {
          '^.+\\.jsx?$': './node_modules/jest-transformer.js'
        }
      });
    },
    webpack(skill, { config }) {
      return skill
        .extendConfig('jest', {
          moduleNameMapper: {
            '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': `<rootDir>/${config.configsDir}/mocks/fileMock.js`,
            '\\.(css|less|sass|scss)$': 'identity-obj-proxy'
          }
        })
        .addDepsFromPkg('identity-obj-proxy');
    }
  }
};
