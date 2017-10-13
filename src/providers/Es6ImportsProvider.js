// @flow
import { spawn } from 'child-process-promise';
// import cjsToEs6 from 'cjs-to-es6';
import colors from 'colors/safe';
import denodeify from 'denodeify';
import findit from 'findit';
import fs from 'fs';
import flatten from 'lodash/flatten';
import path from 'path';
import uniq from 'uniq';
import type { ProviderInput } from './ProviderInterface';

const statAsync = denodeify(fs.stat);
const existsAsync = denodeify(fs.exists);

const verbose = true;

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
  console.log(`\nTransforming ${
    colors.yellow('require()')
  } to ${
    colors.cyan('import')
  } ...`);
  return runCodeshift('cjs.js', files);
}

function deexportify(files: string[]) {
  console.log(`\nTransforming ${
    colors.yellow('module.exports')
  }/${
    colors.red('exports')
  } to ${
    colors.cyan('export')
  } ...`);
  return runCodeshift('exports.js', files);
}

// Promise.resolve()
//   .then(() => {
//     console.log(
//       `${colors.rainbow('\nAhoy!')} ES6ifyin' your CommonJS for ya...`
//     );
//     return Promise.all(
//       files.map((file: string) => {
//         file = path.resolve(file);
//         return existsAsync(file)
//           .catch((exists: bool) => {
//             if (!exists) {
//               throw new Error(`file not found: ${file}`);
//             }
//           })
//           .then(() => statAsync(file))
//           .then((stat) => {
//             if (stat.isDirectory()) {
//               return findJsFiles(file);
//             }
//             return [file];
//           });
//       })
//     )
//       .then(flatten)
//       .then(uniq);
//   })
//   .then((files: string[]) => {
//     console.log(`\nFound ${colors.cyan(files.length.toString())} files.`);
//     return derequireify(files).then(() => deexportify(files));
//   })
//   .catch((err: Error) => {
//     if (err.errno === 'E2BIG') {
//       throw new Error('Sorry, too many files at once');
//     }
//     throw err;
//   })
//   .then(() => {
//     console.log(colors.rainbow('\nES6ification complete!'));
//     if (!verbose) {
//       console.log(
//         `Re-run with ${colors.cyan('--verbose')} to see full output.`
//       );
//     }
//     console.log();
//   })
//   .catch((err: Error) => {
//     console.log(err.stack);
//     process.exit(1);
//   });

export default class Es6ImportsProvider implements ProviderInterface {
  providerName = 'es6-imports'

  transform(code: string): string {

  }

  provide(input: ProviderInput) {
    const { files } = input;

    return Promise.all(files.map((file: string) => {
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
    }))
      .then(flatten)
      .then(uniq);
  }
}
