// @flow
import path from 'path';
import fs from 'fs';
import { prompt } from 'inquirer';
import handlebars from 'handlebars';
import semver from 'semver';
import validateLicense from 'validate-npm-package-license';
import validateName from 'validate-npm-package-name';
import program from 'commander';
import git from 'git-config';
import chalk from 'chalk';
import expectOneSubcommand from './helpers/CLI';

const TEMPLATES_DIR = path.resolve(__dirname, 'templates');
// @TODO @HARDCODE Remove hardcoding of versions
const ALFRED_CLI_VERSION = '0.0.0';
const ALFRED_CORE_VERSION = '0.0.0';

const gitConfig = () =>
  new Promise((resolve, reject) => {
    git((err, config) => {
      if (err) reject(err);
      resolve(config);
    });
  });

function escapeQuotes(str: string): string {
  return str.replace(/"/g, '\\"');
}

async function compile(filename: string) {
  const source = await fs.promises.readFile(
    path.resolve(TEMPLATES_DIR, filename)
  );
  return handlebars.compile(source.toString(), { noEscape: true });
}

const GITIGNORE_TEMPLATE = compile('.gitignore.hbs');
const NPM_TEMPLATE = compile('package.json.hbs');
const LIB_BROWSER_TEMPLATE = compile('lib.browser.js.hbs');
const README_TEMPLATE = compile('README.md.hbs');

async function guessAuthor() {
  const author = {
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

function renderLines(lines: Array<string>) {
  console.log(lines.join('\n\n'));
}

async function createNewProject(cwd: string, name: string) {
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

  // check for a scoped name
  const scoped = name.match(/@([^/]+)\/(.*)/);
  const [, scope, local] = scoped || [undefined, null, name];

  renderLines([
    `I'm your assistant Alfred. I'll walk you through creating an Alfred project ${style.project(
      name
    )} Alfred project.`,
    'Press ^C at any time to quit.'
  ]);

  const dirBasename = path.basename(cwd);
  const dirnameEqualsName = dirBasename === name;
  const root = dirnameEqualsName ? cwd : path.resolve(cwd, name);
  if (!dirnameEqualsName) {
    await fs.promises.mkdir(name);
  }

  const guess = await guessAuthor();
  const entry = 'src/lib.browser.js';
  const target = 'targets/prod/lib.browser.js';

  const answers = await prompt([
    {
      type: 'input',
      name: 'version',
      message: 'version',
      default: '0.0.0',
      validate(input) {
        if (semver.valid(input)) {
          return true;
        }
        return `Invalid version: ${input}`;
      }
    },
    { type: 'input', name: 'description', message: 'description' },
    { type: 'input', name: 'git', message: 'git repository' },
    {
      type: 'input',
      name: 'author',
      message: 'author',
      default: guess.name
    },
    {
      type: 'input',
      name: 'email',
      message: 'email',
      default: guess.email
    },
    {
      type: 'input',
      name: 'license',
      message: 'license',
      default: 'MIT',
      validate(input) {
        const self = validateLicense(input);
        if (self.validForNewPackages) {
          return true;
        }
        const errors = self.warnings || [];
        return `Sorry, ${errors.join(' and ')}.`;
      }
    }
  ]);

  answers.name = {
    npm: {
      full: name,
      scope,
      local
    }
  };
  answers.description = escapeQuotes(answers.description);
  answers.git = encodeURI(answers.git);
  answers.author = escapeQuotes(answers.author);
  answers.main = target;

  const templateData = {
    project: answers,
    'alfred-core': {
      major: semver.major(ALFRED_CORE_VERSION),
      minor: semver.minor(ALFRED_CORE_VERSION),
      patch: semver.patch(ALFRED_CORE_VERSION)
    },
    'alfred-cli': {
      major: semver.major(ALFRED_CLI_VERSION),
      minor: semver.minor(ALFRED_CLI_VERSION),
      patch: semver.patch(ALFRED_CLI_VERSION)
    }
  };

  const src = path.resolve(root, 'src');
  await fs.promises.mkdir(src);

  await Promise.all(
    [
      {
        file: '.gitignore',
        content: (await GITIGNORE_TEMPLATE)(templateData)
      },
      {
        file: 'package.json',
        content: (await NPM_TEMPLATE)(templateData)
      },
      {
        file: 'README.md',
        content: (await README_TEMPLATE)(templateData)
      },
      {
        file: 'src/lib.browser.js',
        content: (await LIB_BROWSER_TEMPLATE)(templateData)
      }
    ].map(({ file, content }) =>
      fs.promises.writeFile(path.join(root, file), content)
    )
  );

  const relativeRoot = path.relative(cwd, root);
  const relativeEntryPoint = path.relative(cwd, path.resolve(root, entry));

  renderLines([
    `Awesome! Your Alfred project has been created in: ${style.filePath(
      relativeRoot
    )}`,
    `The main Node entry point is at: ${style.filePath(relativeEntryPoint)}`,
    `To build your project, just run ${style.command(
      'npm install'
    )} from within the ${style.filePath(relativeRoot)} directory.`,
    'Happy hacking!'
  ]);
}

(async () => {
  const { args } = program.parse(process.argv);
  const name = expectOneSubcommand(args);
  createNewProject(process.cwd(), name);
})();
