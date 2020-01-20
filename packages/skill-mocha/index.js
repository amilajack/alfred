const fs = require('fs');
const path = require('path');
const {
  getConfigByConfigName,
  execCommand,
  getPkgBinPath
} = require('@alfred/helpers');

module.exports = {
  name: 'mocha',
  description: 'Run tests for your project',
  interfaces: ['@alfred/interface-test'],
  devDependencies: { mocha: '5.2.0' },
  configFiles: [],
  supports: {
    env: ['production', 'development', 'test'],
    targets: ['node'],
    projectTypes: ['app', 'lib']
  },
  hooks: {
    async call({ project, config, ctf, flags }) {
      const binPath = await getPkgBinPath('mocha', 'mocha');
      const mochaBabelRegisterPath = path.join(
        project.root,
        config.showConfigs ? config.configsDir : 'node_modules',
        'mocha.js'
      );
      const { config: babelConfig } = getConfigByConfigName(
        'babel',
        ctf.get('babel').configFiles
      );
      await fs.promises.writeFile(
        mochaBabelRegisterPath,
        `const babelRegister = require('@babel/register');
        require("@babel/register")(${JSON.stringify(babelConfig)});`
      );
      return execCommand(
        [binPath, `--require ${mochaBabelRegisterPath} tests`, ...flags].join(
          ' '
        )
      );
    }
  },
  ctfs: {
    eslint: ctf =>
      ctf
        .extendConfig('eslint', {
          plugins: ['mocha']
        })
        .addDevDependencies({
          'eslint-plugin-mocha': '3.0.1'
        })
  }
};
