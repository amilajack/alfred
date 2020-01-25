import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import { prompt } from 'inquirer';
import validateLicense from 'validate-npm-package-license';
import validateName from 'validate-npm-package-name';
import program from 'commander';
import git from 'git-config';
import chalk from 'chalk';
import { getSingleSubcommandFromArgs, GitConfig, addBoilerplate } from '..';

const { version: ALFRED_PKG_VERSION } = require('@alfred/core/package.json');

function gitConfig(): Promise<GitConfig> {
  return new Promise((resolve, reject) => {
    git((err?: Error, config?: GitConfig) => {
      if (err) reject(err);
      resolve(config);
    });
  });
}

function escapeQuotes(str: string): string {
  return str.replace(/"/g, '\\"');
}

type Author = {
  email?: string;
  name?: string;
};

async function guessAuthor(): Promise<Author> {
  const author: Author = {
    name: process.env.USER || process.env.USERNAME,
    email: undefined
  };
  try {
    const config = await gitConfig();
    if (config.user.name) {
      author.name = config.user.name;
    }
    if (config.user.email) {
      author.email = config.user.email;
    }
    return author;
  } catch (e) {
    return author;
  }
}

function renderLines(lines: Array<string>): void {
  console.log(lines.join('\n\n'));
}

async function createNewProject(cwd: string, name: string): Promise<void> {
  const dirBasename = path.basename(cwd);
  const dirnameEqualsName = dirBasename === name;
  const root = dirnameEqualsName ? cwd : path.resolve(cwd, name);
  // Check if the directory name already exists before creating the project
  if (!dirnameEqualsName && fs.existsSync(root)) {
    return console.log(
      `${chalk.bgBlack.cyan('Alfred')} ${chalk.bgBlack.red(
        'ERR!'
      )} Directory ${name} already exists`
    );
  }

  const style = {
    project: chalk.cyan.bold,
    command: chalk.green.bold,
    filePath: chalk.cyan,
    error(msg: string): string {
      return `${chalk.bgBlack.cyan('Alfred')} ${chalk.bgBlack.red(
        'ERR!'
      )} ${msg}`;
    },
    info(msg: string): string {
      return `${chalk.bgBlack.cyan('Alfred')} ${chalk.bgBlack.gray(
        'info'
      )} ${chalk.gray(msg)}`;
    }
  };

  const its = validateName(name);
  if (!its.validForNewPackages) {
    const errors = (its.errors || []).concat(its.warnings || []);
    throw new Error(`Sorry, ${errors.join(' and ')}.`);
  }

  renderLines([
    `I'm your assistant Alfred. I'll walk you through creating your new Alfred project "${style.project(
      name
    )}"`,
    'Press "ctrl + C" at any time to quit.'
  ]);

  const guess = await guessAuthor();

  let answers;

  if (process.env.E2E_CLI_TEST) {
    answers = JSON.parse(process.env.CLI_INPUT || '{}');
  } else {
    answers = await prompt([
      { type: 'input', name: 'description', message: 'description' },
      { type: 'input', name: 'repository', message: 'git repository' },
      {
        name: 'author',
        type: 'input',
        message: 'author',
        default: guess.name
      },
      {
        name: 'email',
        type: 'input',
        message: 'email',
        default: guess.email
      },
      {
        name: 'license',
        type: 'input',
        message: 'license',
        default: 'MIT',
        validate(input: string): string | true {
          const self = validateLicense(input);
          if (self.validForNewPackages) {
            return true;
          }
          const errors = self.warnings || [];
          return `Sorry, ${errors.join(' and ')}.`;
        }
      },
      {
        name: 'npmClient',
        type: 'list',
        choices: ['npm', 'yarn'],
        message: 'npm client',
        default: 'npm'
      },
      {
        name: 'projectType',
        type: 'list',
        choices: ['app', 'lib'],
        message: 'project type',
        default: 'app'
      },
      {
        name: 'target',
        type: 'list',
        choices: ['browser', 'node'],
        message: 'project type',
        default: 'browser'
      }
    ]);
  }

  const filename = `${answers.projectType}.${answers.target}.js`;
  const entry = `./src/${filename}`;
  const targetFile = `./targets/prod/${filename}`;

  answers.name = {
    npm: {
      full: name
    }
  };
  answers.npmClient = escapeQuotes(answers.npmClient);
  answers.projectType = escapeQuotes(answers.projectType);
  answers.description = escapeQuotes(answers.description);
  answers.repository = encodeURI(answers.repository);
  answers.author = escapeQuotes(answers.author);
  answers.main = targetFile;
  answers.targetFile = targetFile;
  answers.module = targetFile;

  const alfredDepFilePath = path.join(__dirname, '../../../alfred');
  const isApp = answers.projectType === 'app';
  const isBrowser = answers.target === 'browser';
  answers.isApp = isApp;
  answers.isLib = !isApp;
  answers.isBrowser = isBrowser;

  const templateData = {
    project: answers,
    'alfred-pkg': {
      semver: process.env.E2E_CLI_TEST
        ? `file:${alfredDepFilePath}`
        : `^${ALFRED_PKG_VERSION}`
    }
  };

  if (!dirnameEqualsName) {
    await fs.promises.mkdir(name);
  }
  const srcDir = path.join(root, 'src');
  const testsDir = path.join(root, 'tests');
  await fs.promises.mkdir(srcDir);
  await fs.promises.mkdir(testsDir);

  await addBoilerplate(templateData, root);

  const relativeRoot = path.relative(cwd, root);
  const relativeEntryPoint = path.relative(cwd, path.resolve(root, entry));

  renderLines(['I am now installing the dependencies for your app']);
  const installCommand =
    answers.npmClient === 'npm' ? `npm install --prefix ${root}` : 'yarn';
  const buildCommand =
    answers.npmClient === 'npm' ? 'npm run build' : 'yarn build';
  // @TODO Install the deps
  if (process.env.IGNORE_INSTALL !== 'true') {
    childProcess.execSync(installCommand, {
      cwd: root,
      stdio: 'inherit'
    });
  }

  return renderLines([
    `Awesome! Your Alfred project has been created in: ${style.filePath(
      relativeRoot
    )}`,
    `The Node entry point is at: ${style.filePath(relativeEntryPoint)}`,
    // `First install your project with ${style.command(installCommand)}`,
    `To build your project, just run ${style.command(
      buildCommand
    )} from within the ${style.filePath(relativeRoot)} directory.`,
    'Happy hacking!'
  ]);
}

(async (): Promise<void> => {
  const { args } = program.parse(process.argv);
  const name = getSingleSubcommandFromArgs(args);
  await createNewProject(process.cwd(), name);
})();
