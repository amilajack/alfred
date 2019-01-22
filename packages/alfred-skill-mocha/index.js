const fs = require('fs');
const path = require('path');
const {
  getPkgBinPath,
  execCommand,
  getConfigByConfigName
} = require('@alfredpkg/core');

module.exports = {
  name: 'mocha',
  description: 'Run tests for your project',
  interfaces: ['@alfredpkg/interface-test'],
  devDependencies: { mocha: '5.2.0' },
  configFiles: [],
  hooks: {
    async call({ ctf, alfredConfig, flags }) {
      const binPath = await getPkgBinPath('mocha', 'mocha');
      const mochaBabelRegisterPath = path.join(
        alfredConfig.root,
        alfredConfig.showConfigs ? '.configs' : 'node_modules',
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
    eslint: config =>
      config
        .extendConfig('eslint', {
          plugins: ['mocha']
        })
        .addDependencies({
          'eslint-plugin-mocha': '3.0.1'
        })
  }
};
