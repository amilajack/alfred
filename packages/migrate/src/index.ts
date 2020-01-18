import random from 'rndm';
import git from 'simple-git/promise';
import path from 'path';
import os from 'os';
import fs from 'fs';
import parser from 'gitignore-parser';
import LebabProvider from './providers/lebab-provider';
import EslintProvider from './providers/eslint-provider';
import ParseInput from './helpers/parse-input';
import { copyFileAsync, readFileAsync, writeFileAsync } from './helpers/fs';
import {
  UserProviderInput,
  ProviderInput
} from './providers/provider-interface';

function checkFileExists(filepath: string): Promise<boolean> {
  return new Promise(resolve => {
    fs.access(filepath, fs.constants.F_OK, error => {
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

async function assertGitWorktreeClean(): Promise<void> {
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

export function handleInput(userInput: UserProviderInput): Promise<string[]> {
  const { root } = userInput;
  return fs.existsSync(path.join(root, '.gitignore'))
    ? (async (): Promise<string[]> => {
        // Remove gitignored files
        const gitignoreFile = await readFileAsync(
          path.join(root, '.gitignore')
        );
        const gitignore = parser.compile(gitignoreFile.toString());
        // Strip the root from all filepaths. gitignore-parse only
        // works with relative filepaths
        const files = await ParseInput(userInput.files);

        return files.filter(
          file =>
            gitignore.accepts(file.substring(root.length)) &&
            !file.includes('node_modules') &&
            !file.includes('bower_components')
        ) as Array<string>;
      })()
    : ParseInput(userInput.files);
}

export default async function Providers(
  userInput: UserProviderInput
): Promise<Array<string> | void | Array<string>> {
  const providers = [LebabProvider, EslintProvider]
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
    parsedUserInput.files.map((file: string) =>
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
