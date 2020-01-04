import program from 'commander';
import Alfred from '@alfred/core';

(async () => {
  const args = program.parse(process.argv);
  const { args: skillsPkgNames } = args;
  const { run } = await Alfred();
})();
