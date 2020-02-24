import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import expect from 'expect';
import alfred from '@alfred/core';
import { serialPromises } from '@alfred/helpers';
import Nightmare from 'nightmare';

const nightmare = Nightmare();

(async (): Promise<void> => {
  const fixturesDir = path.join(__dirname, '../fixtures');
  const fixturesDirs = fs
    .readdirSync(fixturesDir)
    .map(fixtureDir => path.join(fixturesDir, fixtureDir));

  const fixturesTests = fixturesDirs.map(
    (fixtureDir: string) => async (): Promise<void> => {
      const project = await alfred(fixtureDir);

      if (
        !project.entrypoints.some(entrypoint => entrypoint.project === 'app')
      ) {
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
          if (dataStr.includes('Starting')) {
            const url = dataStr.split(' ').find(str => str.includes('http://'));
            console.log(url, dataStr);
            resolve(new URL(url).port);
          }
        });
        start.stderr.on('data', data => {
          console.log(data.toString());
          reject(data.toString());
        });
      });

      const page = await nightmare
        .goto(`http://localhost:${port}`)
        .wait('h1')
        .evaluate(() => document.querySelector('h1').textContent)
        .end()
        .catch(error => {
          console.error('Search failed:', error);
        });
      expect(page).toEqual('Hello from alfred!');

      start.kill();
    }
  );

  serialPromises(fixturesTests);
})();
