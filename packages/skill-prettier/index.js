const {
  getConfigPathByConfigName,
  execCmdInProject,
  getPkgBinPath
} = require('@alfred/helpers');

module.exports = {
  name: 'prettier',
  description: 'Format the source files in your project',
  interfaces: ['@alfred/interface-format'],
  configFiles: [
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
    async run({ configFiles, project, config, flags }) {
      const binPath = await getPkgBinPath(project, 'prettier');
      const configPath = getConfigPathByConfigName('prettier', configFiles);
      return execCmdInProject(
        project,
        [
          binPath,
          '--ignore-path',
          '.gitignore',
          '--single-quote',
          '--write',
          '**/*.js',
          ...flags,
          config.showConfigs ? `--config ${configPath}` : ''
        ].join(' ')
      );
    }
  },
  transforms: {}
};
