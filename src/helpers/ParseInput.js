// @flow
import flatten from 'lodash.flatten';
import uniq from 'uniq';
import findit from 'findit';
import { statAsync } from '../providers';

function findJsFiles(dir: string) {
  return new Promise(((resolve, reject) => {
    const files = [];
    findit(dir).on('file', (file) => {
      // only return files ending in .js
      if (/\.js$/.test(file)) {
        files.push(file);
      }
    }).on('end', () => {
      resolve(files);
    }).on('error', reject);
  }));
}

export default function ParseInput(files: Array<string>): Promise<Array<string>> {
  return Promise.all(files.map(file => statAsync(file).then(stat => (
    stat.isDirectory()
      ? findJsFiles(file)
      : [file]))))
    .then(flatten).then(uniq);
}
