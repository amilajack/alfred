/* eslint import/no-dynamic-require: off */
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import powerset from '@amilajack/powerset';
import childProcess from 'child_process';
// import { INTERFACE_STATES } from '@alfredpkg/core';

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

(async () => {
  const tmpDir = path.join(__dirname, 'tmp');
  const packagesDir = path.join(__dirname, '..', '..', '..');
  const dirnames = await fs.promises.readdir(packagesDir);
  const skillPkgNames = dirnames
    .filter(dirname => dirname.includes('alfred-skill'))
    .map(
      //
      dirname => require(path.join(packagesDir, dirname, 'package.json')).name
    );

  rimraf.sync(tmpDir);
  await fs.promises.mkdir(tmpDir);

  powerset(skillPkgNames.sort())
    // @HACK A temporary hack preventing all the tests from being run
    .slice(0, 1)
    .forEach(async skillCombination => {
      const folderName = skillCombination
        .map(skillName => skillName.slice('@alfredpkg/skill-'.length))
        .join('-');

      const binPath = require.resolve('../../lib/alfred');
      const CLI_INPUT = {
        description: 'foo',
        git: 'foo',
        author: 'foo',
        email: 'foo',
        license: 'MIT',
        projectType: 'app',
        npmClient: 'NPM',
        target: 'browser'
      };
      childProcess.execSync(`${binPath} new ${folderName}`, {
        cwd: tmpDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          E2E_CLI_TEST: true,
          CLI_INPUT: JSON.stringify(CLI_INPUT),
          IGNORE_INSTALL: true
        }
      });
      const projectDir = path.join(tmpDir, folderName);
      childProcess.execSync('yarn', {
        cwd: projectDir,
        stdio: 'inherit'
      });

      // Add the skills to the alfred.skills config
      // skillCombination.forEach(skill => {
      //   childProcess.execSync(
      //     `${binPath} learn file:../../alfred-skill-${skill}`,
      //     {
      //       // cwd: path.join(folderName),
      //       stdio: 'inherit',
      //       env: {
      //         ...process.env,
      //         E2E_CLI_TEST: true
      //       }
      //     }
      //   );
      // });

      ['build', 'build --prod', 'test', 'lint'].forEach(script => {
        childProcess.execSync(`${binPath} run ${script}`, {
          cwd: projectDir,
          stdio: 'inherit',
          env: {
            ...process.env,
            E2E_CLI_TEST: true
          }
        });
      });
    });

  rimraf.sync(tmpDir);
})();
