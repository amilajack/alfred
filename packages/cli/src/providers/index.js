// @flow
import random from 'rndm';
import git from 'simple-git/promise';
import util from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs';
import parser from 'gitignore-parser';
import Es6ImportsProvider from './Es6ImportsProvider';
import LebabProvider from './LebabProvider';
import EslintProvider from './EslintProvider';
import ParseInput from '../helpers/ParseInput';
import { getProjectRoot } from '../helpers';
import type { UserProviderInput, ProviderInput } from './ProviderInterface';

export const copyFileAsync = util.promisify(fs.copyFile);
export const writeFileAsync = util.promisify(fs.writeFile);
export const statAsync = util.promisify(fs.stat);
export const readFileAsync = util.promisify(fs.readFile);
// const unlinkAsync = util.promisify(fs.unlink);

function checkFileExists(filepath): Promise<boolean> {
  return new Promise(resolve => {
    fs.access(filepath, fs.F_OK, error => {
      resolve(!error);
    });
  });
}

async function createBackupFiles(
  files: Array<string>
): Promise<Map<string, string>> {
  const mappings: Map<string, string> = new Map();
  const randomNumber = random();

  await Promise.all(
    files.map(file => {
      const tmpFilePath = path.join(
        os.tmpdir(),
        `${path.parse(file).name}-${randomNumber}`
      );
      return copyFileAsync(file, tmpFilePath).then(() =>
        mappings.set(file, tmpFilePath)
      );
    })
  );

  return mappings;
}

async function assertGitWorktreeClean() {
  const status = await git().status();
  if (status.files.length > status.not_added.length) {
    throw new Error(`

You have modifications to your git worktree.
Please revert or commit them before running convert.
    `);
  }

  if (status.not_added.length > 0) {
    console.log(`
Warning: the following untracked files are present in your repository:
${status.not_added.join('\n')}
Proceeding anyway.
    `);
  }
}

type ProvidersType = Promise<Array<string> | void>;

const projectRoot = getProjectRoot();

export function handleInput(userInput: UserProviderInput) {
  return fs.existsSync(path.join(projectRoot, '.gitignore'))
    ? (async () => {
        // Remove gitignored files
        const gitignoreFile = await readFileAsync(
          path.join(projectRoot, '.gitignore')
        );
        const gitignore = parser.compile(gitignoreFile.toString());
        // Strip the projectRoot from all filepaths. gitignore-parse only
        // works with relative filepaths
        const files = await ParseInput(userInput.files);

        return (files.filter(
          file =>
            gitignore.accepts(file.substring(projectRoot.length)) &&
            !file.includes('node_modules') &&
            !file.includes('bower_components')
        ): Array<string>);
      })()
    : ParseInput(userInput.files);
}

export default async function Providers(
  userInput: UserProviderInput
): ProvidersType | Array<string> {
  const providers = [Es6ImportsProvider, LebabProvider, EslintProvider]
    .map(Provider => new Provider())
    // Sort the providers by priority.
    // @TODO Temporarily sort by priority number. Eventually we'll implement an listener pattern
    //        to hook into when each provider has finished. Providers will listen for when other
    //        provider have finished
    .sort((a, b) => a.priority - b.priority);

  // Force the user to have a clean version control. Makes rollbacks
  // easier
  if (process.env.NODE_ENV !== 'test') {
    await assertGitWorktreeClean();
  }

  if (!userInput.files || !Array.isArray(userInput.files)) {
    throw new Error('Files not provided');
  }

  const parsedUserInput = {
    ...userInput,
    files: await handleInput(userInput)
  };

  // Validate files
  if (!parsedUserInput.files || !parsedUserInput.files.length) {
    throw new Error('No files passed');
  }

  // Check if files exist
  await Promise.all(
    parsedUserInput.files.map(file =>
      checkFileExists(file).then((exists: boolean) => {
        if (!exists) {
          throw new Error(`File "${file}" does not exist`);
        }
        return exists;
      })
    )
  );

  const mappings = await createBackupFiles(parsedUserInput.files);

  const input = {
    // Default config
    unsafe: false,
    verbose: false,
    write: true,
    // User provided config
    ...parsedUserInput,
    files: Array.from(mappings.values())
  };

  // Invoke each provider
  const transformations = providers
    // Filter any unsafe plugins by default. Allow user override
    .filter(provider => (input.unsafe ? true : provider.safe))
    // Chain async transformations
    .reduce(
      (promise: Promise<ProviderInput>, provider) =>
        promise.then((previousInput: ProviderInput) =>
          provider.provide(previousInput)
        ),
      Promise.resolve(input)
    );

  await transformations;

  // If we dont want to write to the original file, return the code in text form.
  // This is ideal for testing
  if (!input.write) {
    const filePromises = Array.from(mappings.values()).map(file =>
      readFileAsync(file)
    );
    const fileBuffers = await Promise.all(filePromises);
    return fileBuffers.map(e => e.toString()).sort();
  }

  // Write the temporary files to the original files
  mappings.forEach(async (tmpFile, originalFile) => {
    await writeFileAsync(originalFile, await readFileAsync(tmpFile));
  });

  // Clear the backups
  return Promise.all(
    Array.from(mappings.values()).map(file => {
      fs.unlinkSync(file);
      return file;
    })
  );
}
