// @flow
/* eslint import/no-dynamic-require: off, no-console: off */
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import Table from 'cli-table3';
import chalk from 'chalk';
import powerset from '@amilajack/powerset';
import childProcess from 'child_process';
import { INTERFACE_STATES } from '@alfredpkg/core';
import mergeConfigs from '@alfredpkg/merge-configs';
import { addEntrypoints, fromEntrypoints } from '../..';

process.on('unhandledRejection', err => {
  throw err;
});

// Goal: Test subcommands for all combinations of entrypoints and skills
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

// If there are n elmenets in this array, 2^n tests will run since that's the number
// of total combinations of the elements in the array.
//
// @TODO Temporarily removed mocha because it was not compatible with browser env
const nonCoreCts = ['lodash', 'webpack', 'react'];

const scripts = [
  // Build
  'build',
  'build --prod',
  'build --dev',
  // Start
  // 'start',
  // 'start --prod',
  // 'start --dev',
  // Test
  'test',
  // Lint
  'lint',
  // Format
  'format'
];

const prodInterfaceStates = INTERFACE_STATES.filter(
  e => e.env === 'production'
);

async function generateTests(skillCombination: Array<string>, tmpDir: string) {
  const folderName = ['e2e', ...skillCombination].join('-');
  const CLI_INPUT = {
    description: 'foo',
    repository: 'foo',
    author: 'foo',
    email: 'foo',
    license: 'MIT',
    npmClient: 'NPM',
    projectType: 'lib',
    target: 'browser'
  };
  const env = {
    ...process.env,
    E2E_CLI_TEST: true,
    CLI_INPUT: JSON.stringify(CLI_INPUT),
    IGNORE_INSTALL: true
  };
  const binPath = require.resolve('../../lib/alfred');
  childProcess.execSync(`${binPath} new ${folderName}`, {
    cwd: tmpDir,
    stdio: 'inherit',
    env
  });
  const projectDir = path.join(tmpDir, folderName);

  // Add the skills to the alfred.skills config
  skillCombination.forEach(skill => {
    childProcess.execSync(`${binPath} learn @alfredpkg/skill-${skill}`, {
      cwd: projectDir,
      stdio: 'inherit',
      env
    });
  });

  return { skillCombination, projectDir, env, binPath };
}

// eslint-disable-next-line import/prefer-default-export
export const serial = (funcs: Array<() => Promise<any>>) =>
  funcs.reduce(
    (promise, func) =>
      // eslint-disable-next-line promise/no-nesting
      promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );

(async () => {
  const tmpDir = path.join(__dirname, 'tmp');
  rimraf.sync(tmpDir);
  await fs.promises.mkdir(tmpDir);

  // Generate e2e tests for each combination of skills
  const e2eTests = await Promise.all(
    powerset(nonCoreCts)
      .sort((a, b) => a.length - b.length)
      // @TODO Instead of each interface state, generate tests from entrypointCombinations
      .map(skillCombination => () => generateTests(skillCombination, tmpDir))
      .slice(0, parseInt(process.env.E2E_TEST_COUNT, 10) || undefined)
      .map(e => e())
  );

  childProcess.execSync('yarn', {
    stdio: 'inherit'
  });

  const issues = [];

  await Promise.all(
    e2eTests.map(async ({ binPath, projectDir, skillCombination, env }) => {
      let command;

      // Generate all possible combinations of entrypoints and test each one
      const entrypointsCombinations = powerset(
        Array.from(
          new Set(
            prodInterfaceStates.map(e => [e.projectType, e.target].join('.'))
          )
        )
      ).sort((a, b) => a.length - b.length);

      // Create a list of all subsets of the interface states like so:
      // [['lib.node'], ['lib.node', 'lib.browser'], etc...]
      await Promise.all(
        entrypointsCombinations.map(async entrypointCombination => {
          const templateData = {
            project: {
              name: {
                npm: {
                  full: 'foo'
                }
              },
              projectDir: './src/',
              projectType: 'lib',
              target: 'browser'
            }
          };

          // Generate interface states from the entrypoints
          const interfaceStates = fromEntrypoints(entrypointCombination);
          // Remove the existing entrypoints in ./src
          rimraf.sync(path.join(projectDir, 'src/*'));
          rimraf.sync(path.join(projectDir, 'tests/*'));
          await addEntrypoints(templateData, projectDir, interfaceStates);

          await serial(
            [true, false].map(showConfigs => async () => {
              // $FlowFixMe
              const pkg = require(path.join(projectDir, 'package.json'));
              const config = mergeConfigs({}, pkg, {
                alfred: {
                  showConfigs
                }
              });
              fs.writeFileSync(
                path.join(projectDir, 'package.json'),
                JSON.stringify(config)
              );

              try {
                command = 'skills';
                childProcess.execSync(`${binPath} skills`, {
                  cwd: projectDir,
                  stdio: 'inherit',
                  env
                });

                console.log(
                  `Testing ${JSON.stringify({
                    skillCombination,
                    entrypointCombination,
                    showConfigs
                  })}`
                );

                const interfaceStateContainsAppProjectType = interfaceStates.some(
                  interfaceState => interfaceState.projectType === 'app'
                );

                await Promise.all(
                  scripts.map(async subcommand => {
                    command = subcommand;
                    try {
                      if (
                        interfaceStateContainsAppProjectType &&
                        subcommand.includes('start')
                      ) {
                        const start = childProcess.spawn(
                          binPath,
                          ['run', subcommand],
                          {
                            cwd: projectDir,
                            env
                          }
                        );

                        start.stdout.once('data', data => {
                          console.log(data);
                          start.kill();
                        });
                        start.stderr.once('data', data => {
                          start.kill();
                          throw new Error(data);
                        });
                      } else {
                        childProcess.execSync(`${binPath} run ${subcommand}`, {
                          cwd: projectDir,
                          stdio: 'inherit',
                          env
                        });
                      }
                    } catch (e) {
                      issues.push([
                        skillCombination.join(', '),
                        entrypointCombination.join(', '),
                        command,
                        showConfigs
                      ]);
                      console.log(e);
                    }
                  })
                );

                command = 'clean';
                childProcess.execSync(`${binPath} clean`, {
                  cwd: projectDir,
                  stdio: 'inherit',
                  env
                });
              } catch (e) {
                issues.push([
                  skillCombination.join(', '),
                  entrypointCombination.join(', '),
                  command,
                  showConfigs
                ]);
                console.log(e);
              }
            })
          );
        })
      );
    })
  );

  const totalTestsCount =
    // The total # of combinations of skills
    e2eTests.length *
    // The total # of combinations of interfaceStates
    (2 ** prodInterfaceStates.length - 1) *
    // The number of subcommands tested
    scripts.length *
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
    rimraf.sync(tmpDir);
  }
})();