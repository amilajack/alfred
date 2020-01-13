/* eslint import/no-extraneous-dependencies: off */
import flatten from 'lodash.flatten';
import uniq from 'uniq';
import findit from 'findit';
import { statAsync } from './fs';

export function findJsFiles(dir: string): Promise<Array<string>> {
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

export default function parseInput(
  files: Array<string> = []
): Promise<Array<string>> {
  return Promise.all(
    files.map(file =>
      statAsync(file).then(stat =>
        stat.isDirectory() ? findJsFiles(file) : [file]
      )
    )
  )
    .then(flatten)
    .then(uniq)
    .then(filteredFiles => filteredFiles.sort());
}
