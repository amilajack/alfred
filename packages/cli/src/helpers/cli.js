// @flow
import path from 'path';
import fs from 'fs';
import pkgUp from 'pkg-up';
import rimraf from 'rimraf';
import { getConfigsBasePath, loadConfig, formatPkgJson } from '@alfred/core';
import type { AlfredConfig, InterfaceState } from '@alfred/core';
import handlebars from 'handlebars';
import { Signale } from 'signale';
import { ENTRYPOINTS, generateInterfaceStatesFromProject } from './ctf';
import PkgValidation from '../pkg-validation';

export const getInstallCommmand = (alfredConfig: AlfredConfig): string => {
  const { root, npmClient } = alfredConfig;
  return npmClient.toLowerCase() === 'npm'
    ? `npm install --prefix ${root}`
    : 'yarn';
};

/**
 * Execute promises serially
 */
export const serial = (funcs: Array<() => Promise<any>>) =>
  funcs.reduce(
    (promise, func) =>
      // eslint-disable-next-line promise/no-nesting
      promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );

export function validatePkg() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const result = PkgValidation.validate(fs.readFileSync(pkgPath).toString());

  if (result.messagesCount) {
    const signale = new Signale();
    signale.note(pkgPath);
    result.recommendations.forEach(warning => {
      signale.warn(warning);
    });
    result.warnings.forEach(warning => {
      signale.warn(warning);
    });
    result.errors.forEach(warning => {
      signale.error(warning);
    });
  }
}

/**
 * Check if a directory contains an Alfred project
 */
export function checkIsAlfredProject(
  config: AlfredConfig,
  interfaceStates: Array<InterfaceState>
) {
  const srcPath = path.join(config.root, 'src');
  validatePkg();

  if (!fs.existsSync(srcPath)) {
    throw new Error(
      '"./src" directory does not exist. This does not seem to be an Alfred project'
    );
  }

  const hasEntrypoint = ENTRYPOINTS.some(e =>
    fs.existsSync(path.join(srcPath, e))
  );

  if (!hasEntrypoint) {
    throw new Error(
      `You might be in the wrong directory or this is not an Alfred project. The project must have at least one entrypoint. Here are some examples of entrypoints:\n\n${ENTRYPOINTS.map(
        e => `"./src/${e}"`
      ).join('\n')}`
    );
  }

  // Run validation that is specific to each interface state
  interfaceStates
    .map(interfaceState =>
      [
        interfaceState.projectType,
        interfaceState.target,
        interfaceState.env
      ].join('.')
    )
    .forEach(interfaceStateString => {
      switch (interfaceStateString) {
        case 'app.browser.production':
        case 'app.browser.development': {
          const indexHtmlPath = path.join(srcPath, 'index.html');
          if (!fs.existsSync(indexHtmlPath)) {
            throw new Error(
              'An "./src/index.html" file must exist when targeting a browser environment'
            );
          }
          break;
        }
        default:
          break;
      }
    });
}

/**
 * Get the root of a project from the current working directory
 */
export function getProjectRoot() {
  const pkgPath = pkgUp.sync();
  if (!pkgPath) {
    throw new Error(
      `Alfred project root could not be found from "${process.cwd()}".

      Make sure you are inside an Alfred project.`
    );
  }
  return path.dirname(pkgPath);
}

const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

async function compileTemplate(templateFilename: string) {
  const source = await fs.promises.readFile(
    path.resolve(TEMPLATES_DIR, templateFilename)
  );
  return handlebars.compile(source.toString(), { noEscape: true });
}

/**
 * @param {*} templateData
 * @param {*} root
 * @param {*} entrypointInterfaceStates These come in the form of [['lib', 'node], ...etc]
 */
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

export async function init() {
  const projectRoot = getProjectRoot();
  const config = await loadConfig(projectRoot);
  const { alfredConfig } = config;
  const interfaceStates = generateInterfaceStatesFromProject(alfredConfig);
  checkIsAlfredProject(alfredConfig, interfaceStates);
  return { ...config, projectRoot };
}

/**
 * Delete .configs dir
 */
export function deleteConfigs(config: AlfredConfig): Promise<void> {
  const configsBasePath = getConfigsBasePath(config.root);
  if (fs.existsSync(configsBasePath)) {
    return new Promise(resolve => {
      rimraf(configsBasePath, () => {
        resolve();
      });
    });
  }
  return Promise.resolve();
}

export default function getSingleSubcommandFromArgs(
  args: Array<string>
): string {
  switch (args.length) {
    case 0: {
      throw new Error('One subcommand must be passed');
    }
    case 1: {
      break;
    }
    default: {
      throw new Error('Only one subcommand can be passed');
    }
  }

  return args[0];
}
