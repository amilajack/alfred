// @flow
import { spawn } from 'child-process-promise';
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

function runCodeshift(transformName: string, files: string[]): Promise<void> {
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

function deRequireify(files: string[]) {
  return runCodeshift('cjs.js', files);
}

function deExportify(files: string[]) {
  return runCodeshift('exports.js', files);
}

export default class Es6ImportsProvider implements ProviderInterface {
  providerName = 'es6-imports'

  priority = 0;

  transform(files: Array<string>): string {
    deRequireify(files);
  }

  provide(input: ProviderInput): Promise<ProviderInput> {
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
