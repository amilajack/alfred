const path = require('path');
const {
  getConfigPathByConfigName,
  execCmdInProject,
  getPkgBinPath
} = require('@alfred/helpers');

module.exports = {
  name: 'prettier',
  description: 'Format the source files in your project',
  interfaces: ['@alfred/interface-format'],
  configs: [
    {
      alias: 'prettier',
      filename: '.prettierrc',
      fileType: 'json',
      config: {
        singleQuote: true
      }
    }
  ],
  hooks: {
    async run({ configs, project, config, data }) {
      const binPath = await getPkgBinPath(project, 'prettier');
      const configPath = path.join(
        config.configsDir,
        getConfigPathByConfigName('prettier', configs)
      );
      return execCmdInProject(
        project,
        [
          binPath,
          '--ignore-path',
          '.gitignore',
          '--single-quote',
          '--write',
          '**/*.js',
          ...data.flags,
          config.showConfigs ? `--config ${configPath}` : ''
        ].join(' ')
      );
    }
  },
  transforms: {}
};
