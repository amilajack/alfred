import { spawn } from 'child-process-promise';
import cjsToEs6 from 'cjs-to-es6';
import colors from 'colors/safe';
import denodeify from 'denodeify';
import findit from 'findit';
import fs from 'fs';
import flatten from 'lodash/flatten';
import path from 'path';
import uniq from 'uniq';

const yargs = require('yargs')
  .usage('Usage: $0 [ files/directories ... ]')
  .boolean('h')
  .alias('h', 'help')
  .describe('h', 'show help message')
  .boolean('verbose')
  .describe('verbose', 'show verbose output')
  .default('verbose', false)
  .example('$0 index.js', 'convert a single file')
  .example('$0 lib/', 'convert all files in a directory')
  .example('$0 foo.js bar.js lib/', 'convert many files/directories');

const statAsync = denodeify(fs.stat);
const existsAsync = denodeify(fs.exists);

const files = yargs.argv._;
const verbose = yargs.argv.verbose;

if (yargs.argv.h || !files.length) {
  console.log(
    `\ncjs-to-es6 v${
      require('./package.json').version
    }: ${
      require('./package.json').description
    }\n`
  );
  yargs.showHelp();
  process.exit(0);
}

function findJsFiles(dir: string) {
  return new Promise((resolve, reject) => {
    const files: string[] = [];
    findit(dir)
      .on('file', (file: string) => {
        // only return files ending in .js
        if (/\.js$/.test(file)) {
          files.push(file);
        }
      })
      .on('end', () => {
        resolve(files);
      })
      .on('error', reject);
  });
}

function runCodeshift(transformName: string, files: string[]) {
  const cmd = require.resolve('jscodeshift/bin/jscodeshift.sh');
  const transform = require.resolve(`5to6-codemod/transforms/${transformName}`);
  const child = spawn(cmd, ['-t', transform].concat(files));
  child.progress((childProcess) => {
    if (verbose) {
      childProcess.stdout.pipe(process.stdout);
    } else {
      childProcess.stdout.on('data', (data: Buffer) => {
        if (/^Results: /.test(String(data))) {
          console.log(String(data).replace(/\n$/, ''));
        }
      });
    }
    childProcess.stderr.pipe(process.stderr);
  });
  return child;
}

function derequireify(files: string[]) {
  console.log(
    `\nTransforming ${
      colors.yellow('require()')
    } to ${
      colors.cyan('import')
    } ...`
  );
  return runCodeshift('cjs.js', files);
}

function deexportify(files: string[]) {
  console.log(
    `\nTransforming ${
      colors.yellow('module.exports')
    }/${
      colors.red('exports')
    } to ${
      colors.cyan('export')
    } ...`
  );
  return runCodeshift('exports.js', files);
}

Promise.resolve()
  .then(() => {
    console.log(
      `${colors.rainbow('\nAhoy!')} ES6ifyin' your CommonJS for ya...`
    );
    return Promise.all(
      files.map((file: string) => {
        file = path.resolve(file);
        return existsAsync(file)
          .catch((exists: bool) => {
            if (!exists) {
              throw new Error(`file not found: ${file}`);
            }
          })
          .then(() => statAsync(file))
          .then((stat) => {
            if (stat.isDirectory()) {
              return findJsFiles(file);
            }
            return [file];
          });
      })
    )
      .then(flatten)
      .then(uniq);
  })
  .then((files: string[]) => {
    console.log(`\nFound ${colors.cyan(files.length.toString())} files.`);
    return derequireify(files).then(() => deexportify(files));
  })
  .catch((err: Error) => {
    if (err.errno === 'E2BIG') {
      throw new Error('Sorry, too many files at once');
    }
    throw err;
  })
  .then(() => {
    console.log(colors.rainbow('\nES6ification complete!'));
    if (!verbose) {
      console.log(
        `Re-run with ${colors.cyan('--verbose')} to see full output.`
      );
    }
    console.log();
  })
  .catch((err: Error) => {
    console.log(err.stack);
    process.exit(1);
  });
