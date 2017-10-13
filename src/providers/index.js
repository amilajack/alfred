// @flow
import random from 'rndm';
import util from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs';
import Es6ImportsProvider from './Es6ImportsProvider';
import type { ProviderInput } from './ProviderInterface';

function checkFileExists(filepath): Promise<bool> {
  return new Promise((resolve, reject) => {
    fs.access(filepath, fs.F_OK, (error) => {
      resolve(!error);
    });
  });
}

const copyFileAsync = util.promisify(fs.copyFile);

async function createBackupFiles(files: Array<string>): Promise<Map<string, string>> {
  const mappings: Map<string, string> = new Map();
  const randomNumber = random();

  await Promise.all(files.map((file) => {
    const tmpFilePath = path.join(os.tmpdir(), `${path.parse(file).name}-${randomNumber}`);
    return copyFileAsync(file, tmpFilePath).then(() => mappings.set(file, tmpFilePath));
  }));

  return mappings;
}

export default async function Providers(input: ProviderInput) {
  const providers = [Es6ImportsProvider].map(Provider => new Provider())
    // Sort the providers by priority.
    // @TODO: Temporarily sort by priority number. Eventually we'll implement an listener patterh
    //        to hook into when each provider has finished. Providers will listen for when other
    //        provider have finished
    .sort((a, b) => a.priority - b.priority);


  // Validate files
  // Check if files exist
  await Promise.all(input.files.map(checkFileExists))
    .then(_files => _files.filter(exists => exists));

  const inputWithBackups = {
    ...input,
    files: await createBackupFiles(input.files)
  };

  // Invoke each provider
  const transformations = providers.reduce(
    ((promise: Promise<ProviderInput>, provider) => (
      promise
        .then((_input: ProviderInput) =>
          provider.provide(_input))).catch(console.log)
    ),
    Promise.resolve(inputWithBackups)
  );

  try {
    await transformations;
  } catch (e) {
    console.log('the transformations failed');
  }

  // Clear the backups
}
