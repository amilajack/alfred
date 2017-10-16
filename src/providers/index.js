// @flow
import random from 'rndm';
import util from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs';
import flatten from 'lodash.flatten';
import uniq from 'uniq';
import Es6ImportsProvider from './Es6ImportsProvider';
import LebabProvider from './LebabProvider';
import EslintProvider from './EslintProvider';
import type { UserProviderInput, ProviderInput } from './ProviderInterface';

export const copyFileAsync = util.promisify(fs.copyFile);
export const writeFileAsync = util.promisify(fs.writeFile);
export const statAsync = util.promisify(fs.stat);
export const readFileAsync = util.promisify(fs.readFile);
// const unlinkAsync = util.promisify(fs.unlink);

function checkFileExists(filepath): Promise<bool> {
  return new Promise((resolve, reject) => {
    fs.access(filepath, fs.F_OK, (error) => {
      resolve(!error);
    });
  });
}

async function createBackupFiles(files: Array<string>): Promise<Map<string, string>> {
  const mappings: Map<string, string> = new Map();
  const randomNumber = random();

  await Promise.all(files.map((file) => {
    const tmpFilePath = path.join(os.tmpdir(), `${path.parse(file).name}-${randomNumber}`);
    return copyFileAsync(file, tmpFilePath).then(() => mappings.set(file, tmpFilePath));
  }));

  return mappings;
}

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

function foo(files: Array<string>) {
  return Promise.all(files.map(file => statAsync(file).then((stat) => {
    if (stat.isDirectory()) {
      return findJsFiles(file);
    }
    return [file];
  })))
    .then(flatten).then(uniq);
}

type ProvidersType = Promise<Array<string> | void>;

export default async function Providers(userInput: UserProviderInput): ProvidersType {
  const providers = [
    Es6ImportsProvider,
    LebabProvider,
    EslintProvider
  ]
    .map(Provider => new Provider())
    // Sort the providers by priority.
    // @TODO: Temporarily sort by priority number. Eventually we'll implement an listener patterh
    //        to hook into when each provider has finished. Providers will listen for when other
    //        provider have finished
    .sort((a, b) => a.priority - b.priority);

  // Validate files
  if (!userInput.files || userInput.files.length < 1) {
    console.log('No files passed');
    return;
  }

  // Check if files exist
  await Promise.all(userInput.files.map(file => checkFileExists(file).then((exists: bool) => {
    if (!exists) {
      throw new Error(`File "${file}" does not exist`);
    }
  })));

  const mappings = await createBackupFiles(userInput.files);

  const input = {
    // Default config
    unsafe: false,
    verbose: false,
    write: true,
    // User provided config
    ...userInput,
    files: Array.from(mappings.values())
  };

  // Invoke each provider
  const transformations = providers.reduce(
    ((promise: Promise<ProviderInput>, provider) => (
      promise
        .then((previousInput: ProviderInput) =>
          provider.provide(previousInput)))
    ),
    Promise.resolve(input)
  );

  try {
    await transformations;
  } catch (e) {
    console.log('the transformations failed', e);
  }

  // If we dont want to write to the original file, return the code in text form.
  // This is ideal for testing
  if (!input.write) {
    return Promise.all(Array
      .from(mappings.values())
      .map(filename => readFileAsync(filename)))
      .then(files => files.map(e => e.toString()));
  }

  // Write the temporary files to the original files
  mappings.forEach(async (tmpFile, originalFile) => {
    await writeFileAsync(originalFile, await readFileAsync(tmpFile));
  });

  // Clear the backups
  return Promise.all(Array.from(mappings.values()).map(fs.unlinkSync));
}
