/* eslint import/no-dynamic-require: off */
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import powerset from '@amilajack/powerset';
import childProcess from 'child_process';
// import { INTERFACE_STATES } from '@alfredpkg/core';

process.on('unhandledRejection', err => {
  throw err;
});

// Create a ./tmp directory
// Start by having all the packages for the skills installed
// For each combination c[] of CTFs
//  consider c[] to be the skills. Add c[] to the ctf
//    for each interfaceState in interfaceStates[9] (include all targets)
//      Default skills will automatically be added
//      Install the necessary deps
//      Run:
//       * lint
//       * format
//       * build
//       * build --dev
//       * build --prod
//       * start
//       * start --prod
//       * start --dev
//       * test
//       * skills
//      test with showConfigs: true
//      test with showConfigs: false

const nonCoreCts = ['lodash', 'webpack', 'react', 'mocha'];

(async () => {
  const tmpDir = path.join(__dirname, 'tmp');
  rimraf.sync(tmpDir);
  await fs.promises.mkdir(tmpDir);

  const CLI_INPUT = {
    description: 'foo',
    git: 'foo',
    author: 'foo',
    email: 'foo',
    license: 'MIT',
    projectType: 'lib',
    npmClient: 'NPM',
    target: 'browser'
  };
  const env = {
    ...process.env,
    E2E_CLI_TEST: true,
    CLI_INPUT: JSON.stringify(CLI_INPUT),
    IGNORE_INSTALL: true
  };

  powerset(nonCoreCts)
    .sort((a, b) => a.length - b.length)
    // @HACK A temporary hack preventing all the tests from being run
    .slice(0, 5)
    .forEach(async skillCombination => {
      const folderName = skillCombination.join('-');

      const binPath = require.resolve('../../lib/alfred');
      childProcess.execSync(`${binPath} new ${folderName}`, {
        cwd: tmpDir,
        stdio: 'inherit',
        env
      });
      const projectDir = path.join(tmpDir, folderName);
      childProcess.execSync('yarn', {
        cwd: projectDir,
        stdio: 'inherit',
        env
      });

      console.log(`Testing skill combination ${skillCombination.join(' ')}`);

      // Add the skills to the alfred.skills config
      const projectPkgJson = path.join(projectDir, 'package.json');
      const a = JSON.parse(await fs.promises.readFile(projectPkgJson));
      const skillsPkgNames = skillCombination.map(e => `@alfredpkg/skill-${e}`);
      await fs.promises.writeFile(
        projectPkgJson,
        JSON.stringify({
          ...a,
          alfred: {
            ...(a.alfred || {}),
            skills: skillsPkgNames
          }
        })
      );

      ['build', 'build --prod', 'test', 'lint', 'format'].forEach(script => {
        childProcess.execSync(`${binPath} run ${script}`, {
          cwd: projectDir,
          stdio: 'inherit',
          env
        });
      });
    });
})();
