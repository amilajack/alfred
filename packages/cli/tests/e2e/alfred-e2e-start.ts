import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import expect from 'expect';
import alfred from '@alfred/core';
import { serialPromises } from '@alfred/helpers';
import Nightmare from 'nightmare';

process.on('unhandledRejection', err => {
  throw err;
});

function testFixturDir(fixtureDir: string) {
  return async (): Promise<void> => {
    // @TODO @HACK Only test on macOS for now
    if (process.platform !== 'darwin') {
      return;
    }

    console.info(`Testing ${fixtureDir}`);

    const nightmare = new Nightmare();

    const project = await alfred(fixtureDir);

    if (!project.entrypoints.some(entrypoint => entrypoint.project === 'app')) {
      return;
    }

    const binPath = require.resolve('../../lib/commands/alfred');

    const start = spawn(binPath, ['run', 'start'], {
      cwd: fixtureDir,
      env: {
        ...process.env,
        ALFRED_E2E_TEST: 'true'
      }
    });

    const port = await new Promise((resolve, reject) => {
      start.stdout.on('data', data => {
        const dataStr = data.toString();
        console.log(dataStr);
        if (dataStr.includes('http://')) {
          const url = dataStr
            .split(' ')
            .find((str: string) => str.includes('http://'))
            .trim();
          resolve(new URL(url).port);
        }
      });
      start.stderr.on('data', data => {
        reject(data.toString());
      });
    });

    const page = await nightmare
      .goto(`http://localhost:${port}`)
      .wait('h1')
      .evaluate(() => document.querySelector('h1').textContent)
      .end();
    expect(page).toEqual('Hello from Alfred!');

    start.kill();
  };
}

(async (): Promise<void> => {
  const cliFixturesDir = path.join(__dirname, '../fixtures');
  const examplesDir = path.join(__dirname, '../../../../examples');

  const fixturesDirs = [
    ...fs
      .readdirSync(cliFixturesDir)
      .map(fixtureDir => path.join(cliFixturesDir, fixtureDir)),
    ...fs
      .readdirSync(examplesDir)
      .map(exampleDir => path.join(examplesDir, exampleDir))
      .filter(dir => !dir.includes('alfred-config-example'))
  ].filter(dir => fs.statSync(dir).isDirectory());

  await serialPromises(fixturesDirs.map(testFixturDir));
})();
