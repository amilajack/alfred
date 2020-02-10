const fs = require('fs');
const path = require('path');
const { execCmdInProject, getPkgBinPath } = require('@alfred/helpers');

module.exports = {
  name: 'mocha',
  description: 'Run tests for your project',
  interfaces: ['@alfred/interface-test'],
  configs: [],
  supports: {
    envs: ['production', 'development', 'test'],
    targets: ['node'],
    projectTypes: ['app', 'lib']
  },
  hooks: {
    async run({ project, config, skillMap, data }) {
      const binPath = await getPkgBinPath(project, 'mocha');
      const mochaBabelRegisterPath = path.join(
        project.root,
        config.showConfigs ? config.configsDir : 'node_modules',
        'mocha.js'
      );
      const { config: babelConfig } = skillMap
        .get('babel')
        .configs.get('babel');
      await fs.promises.writeFile(
        mochaBabelRegisterPath,
        `const babelRegister = require('@babel/register');
        require("@babel/register")(${JSON.stringify(babelConfig)});`
      );
      return execCmdInProject(
        project,
        [
          binPath,
          `--require ${mochaBabelRegisterPath} tests`,
          ...data.flags
        ].join(' ')
      );
    }
  }
};
