import fs from 'fs';
import path from 'path';
import powerset from '@amilajack/powerset';
import childProcess from 'child_process';
import { INTERFACE_STATES } from '@alfredpkg/core';

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

function createTmpDirForProject(projectName: string) {
  return fs.promises.mkdir(path.join(__dirname, '.tmp', projectName));
}

(async () => {
  const packagesDir = path.join(__dirname, '..', '..', '..');
  const dirnames = await fs.promises.readdir(packagesDir);
  const skillPkgNames = dirnames
    .filter(dirname => dirname.includes('alfred-skill'))
    .map(
      dirname => require(path.join(packagesDir, dirname, 'package.json')).name
    );

  console.log(skillPkgNames);

  powerset(skillPkgNames.sort()).forEach(async skillCombination => {
    const folderName = skillCombination
      .map(skillName => skillName.slice('@alfredpkg/skill-'.length))
      .join('-');
    await createTmpDirForProject(folderName);

    const binPath = require.resolve('../../lib/alfred');
    childProcess.execSync(`${binPath} new ${createTmpDirForProject}`, {
      cwd: folderName,
      env: {
        E2E_CLI_TEST: true,
        FOO: JSON.stringify({
          description: folderName,
          git: '',
          author: '',
          email: '',
          license: '',
          npmClient: 'npm',
          projectType: 'app',
          target: 'browser'
        })
      }
    });

    skillCombination.forEach(skill => {
      childProcess.execSync(
        `${binPath} learn file:../../alfred-skill-${skill}`,
        {
          cwd: folderName,
          env: {
            E2E_CLI_TEST: true
          }
        }
      );
    });

    ['build', 'build --prod', 'test', 'lint'].forEach(script => {
      childProcess.execSync(`${binPath} run ${script}`, {
        cwd: folderName,
        env: {
          E2E_CLI_TEST: true
        }
      });
    });
  });
})();
