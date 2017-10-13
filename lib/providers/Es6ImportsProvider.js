'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _childProcessPromise = require('child-process-promise');

var _safe = require('colors/safe');

var _safe2 = _interopRequireDefault(_safe);

var _denodeify = require('denodeify');

var _denodeify2 = _interopRequireDefault(_denodeify);

var _findit = require('findit');

var _findit2 = _interopRequireDefault(_findit);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _flatten = require('lodash/flatten');

var _flatten2 = _interopRequireDefault(_flatten);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _uniq = require('uniq');

var _uniq2 = _interopRequireDefault(_uniq);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const statAsync = (0, _denodeify2.default)(_fs2.default.stat);
// import cjsToEs6 from 'cjs-to-es6';

const existsAsync = (0, _denodeify2.default)(_fs2.default.exists);

const verbose = true;

function findJsFiles(dir) {
  return new Promise((resolve, reject) => {
    const files = [];
    (0, _findit2.default)(dir).on('file', file => {
      // only return files ending in .js
      if (/\.js$/.test(file)) {
        files.push(file);
      }
    }).on('end', () => {
      resolve(files);
    }).on('error', reject);
  });
}

function runCodeshift(transformName, files) {
  const cmd = require.resolve('jscodeshift/bin/jscodeshift.sh');
  const transform = require.resolve(`5to6-codemod/transforms/${transformName}`);
  const child = (0, _childProcessPromise.spawn)(cmd, ['-t', transform].concat(files));

  child.progress(childProcess => {
    if (verbose) {
      childProcess.stdout.pipe(process.stdout);
    } else {
      childProcess.stdout.on('data', data => {
        if (/^Results: /.test(String(data))) {
          console.log(String(data).replace(/\n$/, ''));
        }
      });
    }
    childProcess.stderr.pipe(process.stderr);
  });

  return child;
}

function derequireify(files) {
  console.log(`\nTransforming ${_safe2.default.yellow('require()')} to ${_safe2.default.cyan('import')} ...`);
  return runCodeshift('cjs.js', files);
}

function deexportify(files) {
  console.log(`\nTransforming ${_safe2.default.yellow('module.exports')}/${_safe2.default.red('exports')} to ${_safe2.default.cyan('export')} ...`);
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

class Es6ImportsProvider {
  constructor() {
    this.providerName = 'es6-imports';
  }

  transform(code) {}

  provide(input) {
    const { files } = input;

    return Promise.all(files.map(file => {
      file = _path2.default.resolve(file);
      return existsAsync(file).catch(exists => {
        if (!exists) {
          throw new Error(`file not found: ${file}`);
        }
      }).then(() => statAsync(file)).then(stat => {
        if (stat.isDirectory()) {
          return findJsFiles(file);
        }
        return [file];
      });
    })).then(_flatten2.default).then(_uniq2.default);
  }
}
exports.default = Es6ImportsProvider;