// @flow
/* eslint import/no-dynamic-require: off */
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import Table from 'cli-table3';
import chalk from 'chalk';
import powerset from '@amilajack/powerset';
import childProcess from 'child_process';
import { INTERFACE_STATES } from '@alfredpkg/core';

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

async function generateTests(
  skillCombination: Array<string>,
  tmpDir: string,
  projectType: string,
  target: string
) {
  const folderName = ['e2e', ...skillCombination, projectType, target].join(
    '-'
  );
  const CLI_INPUT = {
    description: 'foo',
    git: 'foo',
    author: 'foo',
    email: 'foo',
    license: 'MIT',
    npmClient: 'NPM',
    projectType,
    target
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

  return { skillCombination, projectDir, env, target, projectType, binPath };
}

(async () => {
  const tmpDir = path.join(__dirname, 'tmp');
  rimraf.sync(tmpDir);
  await fs.promises.mkdir(tmpDir);

  const res = await Promise.all(
    powerset(nonCoreCts)
      .sort((a, b) => a.length - b.length)
      .map(skillCombination =>
        INTERFACE_STATES.filter(e => e.env === 'production').map(
          interfaceState => () =>
            generateTests(
              skillCombination,
              tmpDir,
              interfaceState.projectType,
              interfaceState.target
            )
        )
      )
      .reduce((p, c) => p.concat(c))
      // .slice(0, 5)
      .map(e => e())
  );

  childProcess.execSync('yarn', {
    stdio: 'inherit'
  });

  const issues = [];

  res.forEach(
    ({ binPath, projectDir, skillCombination, target, projectType, env }) => {
      try {
        childProcess.execSync(`${binPath} skills`, {
          cwd: projectDir,
          stdio: 'inherit',
          env
        });

        console.log(
          `Testing ${JSON.stringify({
            skillCombination,
            target,
            projectType
          })}`
        );

        ['build', 'build --prod', 'test', 'lint', 'format'].forEach(script => {
          childProcess.execSync(`${binPath} run ${script}`, {
            cwd: projectDir,
            stdio: 'inherit',
            env
          });
        });

        childProcess.execSync(`${binPath} clean`, {
          cwd: projectDir,
          stdio: 'inherit',
          env
        });
      } catch (e) {
        issues.push([skillCombination.join(', '), target, projectType]);
        console.log(e);
      }
    }
  );

  if (issues.length) {
    const table = new Table({
      head: [
        chalk.bold('Failing Skill Combinations'),
        chalk.bold('Target'),
        chalk.bold('Project Type')
      ]
    });
    issues.forEach(issue => {
      table.push(issue);
    });
    console.log(table.toString());
  } else {
    console.log('All e2e tests are passing! Yayy 🎉 🎉 🎉');
    rimraf.sync(tmpDir);
  }
})();
