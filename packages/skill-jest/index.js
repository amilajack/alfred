const fs = require('fs');
const path = require('path');
const { execCmdInProject, getPkgBinPath } = require('@alfred/helpers');
const { getConfigPathByConfigName, getConfig } = require('@alfred/helpers');

module.exports = {
  name: 'jest',
  description: 'Test your JS files',
  interfaces: ['@alfred/interface-test'],
  configFiles: [
    {
      alias: 'jest',
      filename: 'jest.config.js',
      config: {
        moduleNameMapper: {
          '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/__mocks__/fileMock.js',
          '\\.(css|less)$': 'identity-obj-proxy'
        }
      }
    }
  ],
  hooks: {
    async run({ configFiles, skillMap, config, project, data }) {
      const configPath = getConfigPathByConfigName('jest', configFiles);
      const { root } = project;

      // Create the node_modules dir if it doesn't exist
      const nodeModulesPath = path.join(root, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        await fs.promises.mkdir(nodeModulesPath);
      }
      const jestTransformerPath = path.join(
        root,
        'node_modules',
        'jest-transformer.js'
      );
      const { config: babelConfig } = getConfig(
        'babel',
        skillMap.get('babel').configFiles
      );
      const hiddenTmpConfigPath = path.join(
        root,
        'node_modules',
        'jest.config.js'
      );
      const { config: jestConfig } = getConfig('jest', configFiles);
      const fullConfig = {
        ...jestConfig,
        transform: {
          '^.+.jsx?$': '<rootDir>/node_modules/jest-transformer.js'
        },
        rootDir: `${root}`
      };
      await fs.promises.writeFile(
        // @TODO Write to ./node_modules/.alfred
        config.showConfigs ? configPath : hiddenTmpConfigPath,
        `module.exports = ${JSON.stringify(fullConfig)};`
      );
      if (!config.showConfigs && fs.existsSync(configPath)) {
        await fs.promises.unlink(configPath);
      }
      const babelJestPath = require.resolve('./babel-jest');
      await fs.promises.writeFile(
        jestTransformerPath,
        `const babelJestTransform = require(${JSON.stringify(babelJestPath)});
        module.exports = babelJestTransform.createTransformer(${JSON.stringify(
          babelConfig
        )});`
      );

      const binPath = await getPkgBinPath(project, 'jest');

      return execCmdInProject(
        project,
        [
          binPath,
          config.showConfigs
            ? `--config ${JSON.stringify(configPath)} ${JSON.stringify(root)}`
            : `--config ${hiddenTmpConfigPath} ${JSON.stringify(root)}`,
          ...data.flags
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
