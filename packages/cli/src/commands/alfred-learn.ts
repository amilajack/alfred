import program from 'commander';
import alfred from '@alfred/core';

(async (): Promise<void> => {
  const args = program.parse(process.argv);
  const { args: skillsPkgNames } = args;
  const project = await alfred();
  await project.run('learn', skillsPkgNames);
})();
