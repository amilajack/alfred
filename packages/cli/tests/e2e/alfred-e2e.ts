/* eslint no-console: off */
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import rimraf from 'rimraf';
import Table from 'cli-table3';
import chalk from 'chalk';
import getPort from 'get-port';
import powerset from '@amilajack/powerset';
import childProcess from 'child_process';
import { ENTRYPOINTS } from '@alfred/core/lib/constants';
import { formatPkgJson } from '@alfred/core';
import mergeConfigs from '@alfred/merge-configs';
import Config from '@alfred/core/lib/config';
import { Env, ProjectEnum, Platform, Skill } from '@alfred/types';
import { serialPromises } from '@alfred/helpers';
import { CORE_SKILLS } from '@alfred/core/lib/skill';
import { addEntrypoints } from '../../lib';

process.on('unhandledRejection', err => {
  throw err;
});

const CLEAN_AFTER_RUN = false;

// Goal: Test subcommands for all combinations of entrypoints and skills
// Create a ./tmp directory
// Start by having all the packages for the skills installed
// For each combination c[] of skills
//  consider c[] to be the skills. Add c[] to the skill
//    for each entrypoint in entrypoints[9] (include all entrypoints)
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

// If there are n elmenets in this array, 2^n tests will run since that's the number
// of total combinations of the elements in the array.

const subcommands = [
  'build',
  'build --prod',
  'build --dev',
  // @TODO Cannot test this because parcel cannot be run concurrently
  // 'start',
  // 'start --prod',
  // 'start --dev',
  'test',
  'lint',
  'format'
];

type E2eTest = {
  skillCombination: Skill[];
  projectDir: string;
  env: NodeJS.ProcessEnv;
  binPath: string;
  folderName: string;
};

const E2E_TESTS_TMP_DIR = path.join(__dirname, 'tmp');

async function generateTestsForSkillCombination(
  skillCombination: Skill[]
): Promise<E2eTest> {
  const skillCombinationNames = skillCombination.map(skill => skill.name);
  const folderName = ['e2e', ...skillCombinationNames].join('-');
  const env = {
    ...process.env,
    ALFRED_E2E_CLI_TEST: 'true',
    ALFRED_IGNORE_INSTALL: 'true',
    ALFRED_CLI_E2E_TEST_INPUT: JSON.stringify({
      description: 'A fixture generated by alfred-e2e',
      repository: 'https://github.com/alfred-js/alfred',
      author: 'Self',
      email: 'johndoe@gmail.com',
      license: 'MIT',
      npmClient: 'NPM',
      project: 'lib',
      platform: 'browser'
    })
  };
  const binPath = require.resolve('../../lib/commands/alfred');
  childProcess.execSync(`node ${binPath} new ${folderName}`, {
    cwd: E2E_TESTS_TMP_DIR,
    stdio: 'inherit',
    env
  });
  const projectDir = path.join(E2E_TESTS_TMP_DIR, folderName);

  // Add the skills to the alfred.skills config
  skillCombinationNames.forEach(skill => {
    childProcess.execSync(`node ${binPath} learn @alfred/skill-${skill}`, {
      cwd: projectDir,
      stdio: 'inherit',
      env
    });
  });

  return { skillCombination, projectDir, env, binPath, folderName };
}

function cleanTmpDir(): void {
  rimraf.sync(E2E_TESTS_TMP_DIR);
}

process.on('unhandledRejection', () => {
  if (CLEAN_AFTER_RUN) {
    cleanTmpDir();
  }
});
process.on('exit', () => {
  if (CLEAN_AFTER_RUN) {
    cleanTmpDir();
  }
});

(async (): Promise<void> => {
  cleanTmpDir();
  await fs.promises.mkdir(E2E_TESTS_TMP_DIR);

  // Test against every combination of skills. Remove CORE_SKILLS that are defaults
  // because they are included by default
  const nonDefaultSkills = Array.from(Object.values(CORE_SKILLS)).filter(
    skill => !skill.default
  );

  // Generate e2e tests for each combination of skills
  const e2eTests = await Promise.all(
    powerset(nonDefaultSkills).map(skillCombination =>
      generateTestsForSkillCombination(skillCombination)
    )
  );

  childProcess.execSync('yarn --frozen-lockfile', {
    stdio: 'inherit'
  });

  const issues = [];

  await Promise.all(
    e2eTests.map(
      async ({ binPath, projectDir, skillCombination, env, folderName }) => {
        let command: string;

        // Generate all possible combinations of entrypoints and test each one
        const entrypointCombinations = powerset(ENTRYPOINTS);

        await Promise.all(
          entrypointCombinations.map(async entrypoints => {
            const templateData = {
              entrypoint: {
                name: {
                  npm: {
                    full: folderName
                  }
                },
                projectDir: './src/',
                env: 'development' as Env,
                filename: 'lib.browser.js',
                project: 'lib' as ProjectEnum,
                platform: 'browser' as Platform
              }
            };

            // Remove the existing entrypoints in ./src
            rimraf.sync(path.join(projectDir, 'src/*'));
            rimraf.sync(path.join(projectDir, 'tests/*'));
            await addEntrypoints(templateData, projectDir, entrypoints);

            await serialPromises(
              [true, false].map(showConfigs => async (): Promise<void> => {
                const pkg = mergeConfigs(
                  {},
                  require(path.join(projectDir, 'package.json')),
                  {
                    alfred: {
                      ...Config.DEFAULT_CONFIG,
                      npmClient: 'yarn',
                      showConfigs
                    }
                  }
                ) as {
                  alfred: Config;
                };

                fs.writeFileSync(
                  path.join(projectDir, 'package.json'),
                  await formatPkgJson(pkg)
                );

                try {
                  command = 'skills';
                  childProcess.execSync(`node ${binPath} skills`, {
                    cwd: projectDir,
                    stdio: 'inherit',
                    env
                  });

                  console.log(
                    `Testing ${JSON.stringify({
                      skills: skillCombination.map(skill => skill.name),
                      entrypoints,
                      showConfigs
                    })}`
                  );

                  const entrypointIsAppProject = entrypoints.some(
                    entrypoint => entrypoint.project === 'app'
                  );

                  await Promise.all(
                    subcommands.map(async subcommand => {
                      command = subcommand;
                      try {
                        if (
                          entrypointIsAppProject &&
                          subcommand.includes('start')
                        ) {
                          const port = await getPort();
                          const start = childProcess.spawn(
                            binPath,
                            ['run', subcommand, `--port ${port}`],
                            {
                              cwd: projectDir,
                              env
                            }
                          );

                          await new Promise((resolve, reject) => {
                            start.stdout.once('data', data => {
                              console.log(data);
                              resolve(data);
                            });
                            start.stderr.once('data', data => {
                              reject(data);
                            });
                          });

                          const page = await fetch(
                            `http://localhost:${port}`
                          ).then(res => res.text());
                          expect(page).toEqual('hello from alfred');

                          start.kill();
                        } else {
                          childProcess.execSync(
                            `node ${binPath} run ${subcommand}`,
                            {
                              cwd: projectDir,
                              stdio: 'inherit',
                              env
                            }
                          );
                        }
                        // Assert that the .configs dir should or should not exist
                        if (
                          path.join(projectDir, pkg.alfred.configsDir) !==
                          projectDir
                        ) {
                          assert.strictEqual(
                            fs.existsSync(
                              path.join(projectDir, pkg.alfred.configsDir)
                            ),
                            showConfigs
                          );
                        }
                      } catch (e) {
                        issues.push([
                          skillCombination.join(', '),
                          entrypoints.join(', '),
                          command,
                          showConfigs
                        ]);
                        console.log(e);
                      }
                    })
                  );

                  command = 'clean';
                  childProcess.execSync(`node ${binPath} clean`, {
                    cwd: projectDir,
                    stdio: 'inherit',
                    env
                  });
                } catch (e) {
                  issues.push([
                    skillCombination.join(', '),
                    entrypoints.join(', '),
                    command,
                    showConfigs
                  ]);
                  console.log(e);
                }
              })
            );
          })
        );
      }
    )
  );

  const totalTestsCount =
    // The total # of combinations of skills
    e2eTests.length *
    // The total # of combinations of entrypoints
    (2 ** ENTRYPOINTS.length - 1) *
    // The number of subcommands tested
    subcommands.length *
    // Show Configs
    2;
  if (issues.length) {
    const table = new Table({
      head: [
        chalk.bold('Failing Skill Combinations'),
        chalk.bold('Entrypoints'),
        chalk.bold('Command'),
        chalk.bold('Show Configs')
      ]
    });
    issues.forEach(issue => {
      table.push(issue);
    });
    // Throw error and don't remove tmpDir so that it can be inspected after the tests
    throw new Error(
      [
        '',
        table.toString(),
        `❗️ ${issues.length} e2e tests failed`,
        `✅ ${totalTestsCount - issues.length} e2e tests passed`
      ].join('\n')
    );
  } else {
    console.log(`All ${totalTestsCount} e2e tests passed! Yayy 🎉 🎉 🎉`);
    cleanTmpDir();
  }
})();
