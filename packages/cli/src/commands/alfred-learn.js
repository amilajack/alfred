import program from 'commander';
import alfred from '@alfred/core';

(async () => {
  const args = program.parse(process.argv);
  const { args: skillsPkgNames } = args;
  const project = await alfred();
  return project.run('learn', skillsPkgNames);
})();
