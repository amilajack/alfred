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
      name: 'prettier',
      path: '.prettierrc',
      write: true,
      config: {}
    }
  ],
  hooks: {
    async call({ configFiles, project, config, flags }) {
      const binPath = await getPkgBinPath('prettier');
      const configPath = getConfigPathByConfigName('prettier', configFiles);
      return execCmdInProject(
        project,
        [
          binPath,
          '--ignore-path',
          '.gitignore',
          '--single-quote',
          '--write',
          '**/*',
          ...flags,
          config.showConfigs ? `--config ${configPath}` : ''
        ].join(' ')
      );
    }
  },
  transforms: {}
};
