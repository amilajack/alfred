/* eslint no-restricted-syntax: off */
import path from 'path';
import fs from 'fs';
import fetch from 'isomorphic-fetch';
import { spawn } from 'child_process';

const dirContents = fs.readdirSync(__dirname);
const fixtureDirs = dirContents
  // @HACK: extend-config causes monorerpo installation issues with parcel's autoinstall
  .filter(e => e !== 'extend-config')
  .map(fixtureDir => path.join(__dirname, fixtureDir))
  .filter(
    fixtureDir =>
      fs.statSync(fixtureDir).isDirectory() &&
      fs.existsSync(path.join(fixtureDir, 'src/app.browser.js'))
  );

jest.setTimeout(10 ** 4);

describe('fixtures', () => {
  describe('apps', () => {
    for (const fixtureDir of fixtureDirs) {
      it(`should render html with expected text on ${fixtureDir}`, async () => {
        const cp = spawn('yarn', ['start'], {
          cwd: fixtureDir
        });
        const url = await new Promise(resolve => {
          cp.stdout.on('data', data => {
            // Wait for output to start serving
            if (data.toString().includes('http://localhost:')) {
              resolve(
                data
                  .toString()
                  .split(' ')
                  .find(str => str.includes('http://localhost:'))
              );
            }
          });
        });
        const responseText = await fetch(url)
          .then(res => res.text())
          .finally(() => {
            cp.kill();
            return new Promise(resolve => {
              cp.on('close', () => {
                resolve();
              });
            });
          });
        expect(responseText).toContain('Document');
      });
    }
  });
});
