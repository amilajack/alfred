/* eslint no-restricted-syntax: off */
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const { spawn } = require('child_process');

jest.setTimeout(10 ** 4);

const dirContents = fs.readdirSync(__dirname);
const fixtureDirs = dirContents
  .map(fixtureDir => ({abs: path.join(__dirname, fixtureDir), rel: fixtureDir}))
  .filter(
    ({abs}) =>
      fs.statSync(abs).isDirectory() &&
      fs.existsSync(path.join(abs, 'src/app.browser.js'))
  );

describe('fixtures', () => {
  describe('apps', () => {
    for (const {abs, rel} of fixtureDirs) {
      it(`should render html with expected text on ${rel}`, async () => {
        const cp = spawn('yarn', ['start'], {
          cwd: abs,
          env: {
            ...process.env,
            ALFRED_E2E_TEST: 'true'
          }
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
