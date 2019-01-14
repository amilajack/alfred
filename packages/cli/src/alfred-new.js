// @flow
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import { prompt } from 'inquirer';
import handlebars from 'handlebars';
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
const APP_TEMPLATE = compile('app.js.hbs');
const LIB_TEMPLATE = compile('lib.js.hbs');
const APP_BROWSER_HTML_TEMPLATE = compile('index.html.hbs');
const README_TEMPLATE = compile('README.md.hbs');
const EDITORCONFIG_TEMPLATE = compile('.editorconfig.hbs');

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

  // check for a scoped name
  const scoped = name.match(/@([^/]+)\/(.*)/);
  const [, scope, local] = scoped || [undefined, null, name];

  renderLines([
    `I'm your assistant Alfred. I'll walk you through creating your new Alfred project "${style.project(
      name
    )}"`,
    'Press ^C at any time to quit.'
  ]);

  const guess = await guessAuthor();

  const answers = await prompt([
    { type: 'input', name: 'description', message: 'description' },
    { type: 'input', name: 'git', message: 'git repository' },
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
      validate(input) {
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
      choices: ['NPM', 'Yarn'],
      message: 'npm client',
      default: 'NPM'
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
      // @TODO @HARDCODE Dynamically get the targets
      choices: ['browser', 'node'],
      message: 'project type',
      default: 'browser'
    }
  ]);

  const entry = `./src/${answers.projectType}.${answers.target}.js`;
  const target = `./targets/prod/${answers.projectType}.${answers.target}.js`;

  answers.name = {
    npm: {
      full: name,
      scope,
      local
    }
  };
  answers.npmClient = escapeQuotes(answers.npmClient);
  answers.projectType = escapeQuotes(answers.projectType);
  answers.description = escapeQuotes(answers.description);
  answers.git = encodeURI(answers.git);
  answers.author = escapeQuotes(answers.author);
  answers.main = target;

  const alfredCoreFilePath = path.join(__dirname, '../../core');
  const alfredCliFilePath = path.join(__dirname, '../../cli');
  const isApp = answers.projectType === 'app';
  const isBrowser = answers.target === 'browser';
  answers.isApp = isApp;
  answers.isBrowser = isBrowser;

  const templateData = {
    project: answers,
    'alfred-core': {
      semver:
        process.env.NODE_ENV === 'test'
          ? `file:${alfredCoreFilePath}`
          : `^${ALFRED_CORE_VERSION}`
    },
    'alfred-cli': {
      semver:
        process.env.NODE_ENV === 'test'
          ? `file:${alfredCliFilePath}`
          : `^${ALFRED_CLI_VERSION}`
    }
  };

  if (!dirnameEqualsName) {
    await fs.promises.mkdir(name);
  }
  const src = path.resolve(root, 'src');
  await fs.promises.mkdir(src);

  await Promise.all(
    [
      {
        file: '.gitignore',
        content: (await GITIGNORE_TEMPLATE)(templateData)
      },
      {
        file: '.editorconfig',
        content: (await EDITORCONFIG_TEMPLATE)(templateData)
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
        file: entry,
        content: (await (isApp ? APP_TEMPLATE : LIB_TEMPLATE))(templateData)
      }
    ].map(({ file, content }) =>
      fs.promises.writeFile(path.join(root, file), content)
    )
  );

  if (isApp && isBrowser) {
    const content = (await APP_BROWSER_HTML_TEMPLATE)(templateData);
    await await fs.promises.writeFile(
      path.join(root, './src/index.html'),
      content
    );
  }

  const relativeRoot = path.relative(cwd, root);
  const relativeEntryPoint = path.relative(cwd, path.resolve(root, entry));

  renderLines(['I am now installing the dependencies for your app']);
  const installCommand = answers.npmClient === 'NPM' ? 'npm install' : 'yarn';
  const buildCommand =
    answers.npmClient === 'NPM' ? 'npm run build' : 'yarn build';
  // @TODO Install the deps
  if (!process.env.IGNORE_INSTALL) {
    childProcess.execSync(installCommand, {
      cwd: root,
      stdio: [0, 1, 2]
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

(async () => {
  const { args } = program.parse(process.argv);
  const name = expectOneSubcommand(args);
  createNewProject(process.cwd(), name);
})();
