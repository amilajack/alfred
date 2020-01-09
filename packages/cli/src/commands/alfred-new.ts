import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import { prompt } from 'inquirer';
import validateLicense from 'validate-npm-package-license';
import validateName from 'validate-npm-package-name';
import program from 'commander';
import git from 'git-config';
import chalk from 'chalk';
import { formatPkgJson } from '@alfred/core';
import handlebars from 'handlebars';
import { InterfaceState } from '@alfred/core';
import getSingleSubcommandFromArgs from '..';

const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

async function compileTemplate(templateFilename: string) {
  const source = await fs.promises.readFile(
    path.resolve(TEMPLATES_DIR, templateFilename)
  );
  return handlebars.compile(source.toString(), { noEscape: true });
}

export async function addEntrypoints(
  rawTemplateData: Object,
  root: string,
  entrypointInterfaceStates: Array<InterfaceState>
) {
  const [
    APP_TEMPLATE,
    LIB_TEMPLATE,
    APP_BROWSER_HTML_TEMPLATE,
    TEST_TEMPLATE
  ] = await Promise.all(
    ['app.js.hbs', 'lib.js.hbs', 'index.html.hbs', 'test.js.hbs'].map(
      compileTemplate
    )
  );

  await Promise.all(
    entrypointInterfaceStates.map(interfaceState => {
      const { projectType, target } = interfaceState;
      const isApp = projectType === 'app';
      const isBrowser = target === 'browser';

      const templateData = {
        ...rawTemplateData,
        project: { projectType, target, isApp, isBrowser }
      };

      const writeIndexHtml = () => {
        if (isApp && isBrowser) {
          const content = APP_BROWSER_HTML_TEMPLATE(templateData);
          return fs.promises.writeFile(
            path.join(root, './src/index.html'),
            content
          );
        }
        return Promise.resolve();
      };

      return Promise.all(
        [
          {
            file: `./src/${projectType}.${target}.js`,
            content: (isApp ? APP_TEMPLATE : LIB_TEMPLATE)(templateData)
          },
          {
            file: `./tests/${projectType}.${target}.spec.js`,
            content: TEST_TEMPLATE(templateData)
          }
        ]
          .map(({ file, content }) =>
            fs.promises.writeFile(path.join(root, file), content)
          )
          .concat([writeIndexHtml()])
      );
    })
  );
}

// This function lives here because it is used in both tests and the cli
export async function addBoilerplate(templateData: Object, root: string) {
  const [
    GITIGNORE_TEMPLATE,
    NPM_TEMPLATE,
    README_TEMPLATE,
    EDITORCONFIG_TEMPLATE
  ] = await Promise.all(
    [
      '.gitignore.hbs',
      'package.json.hbs',
      'README.md.hbs',
      '.editorconfig.hbs'
    ].map(compileTemplate)
  );

  await Promise.all(
    [
      {
        file: '.gitignore',
        content: GITIGNORE_TEMPLATE(templateData)
      },
      {
        file: '.editorconfig',
        content: EDITORCONFIG_TEMPLATE(templateData)
      },
      {
        file: 'README.md',
        content: README_TEMPLATE(templateData)
      }
    ].map(({ file, content }) =>
      fs.promises.writeFile(path.join(root, file), content)
    )
  );

  const pkgPath = path.join(root, 'package.json');
  const formattedPkg = await formatPkgJson(
    JSON.parse(NPM_TEMPLATE(templateData))
  );
  await fs.promises.writeFile(pkgPath, formattedPkg);
  const { projectType, target } = templateData.project;

  await addEntrypoints(templateData, root, [
    { projectType, target, env: 'production' }
  ]);
}

const alfredPkgPath = require.resolve('@alfred/core/package.json');
// eslint-disable-next-line import/no-dynamic-require
const { version: ALFRED_PKG_VERSION } = require(alfredPkgPath);

const gitConfig = () =>
  new Promise((resolve, reject) => {
    git((err?: Error, config: Object) => {
      if (err) reject(err);
      resolve(config);
    });
  });

function escapeQuotes(str: string): string {
  return str.replace(/"/g, '\\"');
}

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
  answers.npmClient = escapeQuotes(answers.npmClient).toLowerCase();
  answers.projectType = escapeQuotes(answers.projectType);
  answers.description = escapeQuotes(answers.description);
  answers.repository = encodeURI(answers.repository);
  answers.author = escapeQuotes(answers.author);
  answers.main = targetFile;
  answers.targetFile = targetFile;
  answers.module = targetFile;

  const alfredFilePath = path.join(__dirname, '../../alfred');
  const isApp = answers.projectType === 'app';
  const isBrowser = answers.target === 'browser';
  answers.isApp = isApp;
  answers.isLib = !isApp;
  answers.isBrowser = isBrowser;

  const templateData = {
    project: answers,
    'alfred-pkg': {
      semver: process.env.E2E_CLI_TEST
        ? `file:${alfredFilePath}`
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
    answers.npmClient === 'NPM' ? `npm install --prefix ${root}` : 'yarn';
  const buildCommand =
    answers.npmClient === 'NPM' ? 'npm run build' : 'yarn build';
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

(async () => {
  const { args } = program.parse(process.argv);
  const name = getSingleSubcommandFromArgs(args);
  createNewProject(process.cwd(), name);
})();
