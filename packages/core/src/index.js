// @flow
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import rimraf from 'rimraf';
import pkgUp from 'pkg-up';
import Signale from 'signale';
import Config from './config';
import { PkgValidation, getConfigsBasePath } from './validation';
import { ENTRYPOINTS } from './ctf';
import { generateInterfaceStatesFromProject } from './interface';
import run from './commands/run';
import type { AlfredConfig } from './types';

// @TODO send the information to a crash reporting service (like sentry.io)
process.on('unhandledRejection', err => {
  throw err;
});

/**
 * Get the root of a project from the current working directory
 * @TODO @REFACTTOR Make this private by removing export
 */
export function searchProjectRoot() {
  const pkgPath = pkgUp.sync();
  if (!pkgPath) {
    throw new Error(
      `Alfred project root could not be found from "${process.cwd()}".

      Make sure you are inside an Alfred project.`
    );
  }
  return path.dirname(pkgPath);
}

export const getInstallCommmand = (alfredConfig: AlfredConfig): string => {
  const { root, npmClient } = alfredConfig;
  return npmClient.toLowerCase() === 'npm'
    ? `npm install --prefix ${root}`
    : 'yarn';
};

export class AlfredProject {
  config: AlfredConfig;

  /**
   * Find the root of an Alfred project
   */
  searchProjectRoot(searchDir = process.cwd()) {
    const pkgPath = pkgUp.sync({
      cwd: searchDir
    });
    if (!pkgPath) {
      throw new Error(
        `Alfred project root could not be found from "${process.cwd()}".

        Make sure you are inside an Alfred project.`
      );
    }
    return path.dirname(pkgPath);
  }

  async init(projectDir) {
    const projectRoot = this.searchProjectRoot(projectDir);
    const config = new Config(projectRoot);
    await config.init();
    this.config = config;
    const { alfredConfig } = config;
    const interfaceStates = generateInterfaceStatesFromProject(alfredConfig);
    this.checkIsAlfredProject(alfredConfig, interfaceStates);
    return { ...config, projectRoot, run: this.run.bind(this) };
  }

  async run(subcommand, skillFlags) {
    const { config: alfredConfig } = this;
    const nodeModulesPath = `${alfredConfig.root}/node_modules`;
    // Install the modules if they are not installed if autoInstall: true
    // @TODO @HACK Note that this might cause issues in monorepos
    if (alfredConfig.autoInstall === true && !fs.existsSync(nodeModulesPath)) {
      const installCommand = getInstallCommmand(alfredConfig);
      childProcess.execSync(installCommand, {
        cwd: alfredConfig.root,
        stdio: 'inherit'
      });
    }
    // $FlowFixMe
    module.paths.push(nodeModulesPath);

    await deleteConfigs(alfredConfig);

    // Built in, non-overridable skills are added here
    switch (subcommand) {
      case 'clean': {
        const targetsPath = path.join(alfredConfig.root, 'targets');
        if (fs.existsSync(targetsPath)) {
          await new Promise(resolve => {
            rimraf(targetsPath, () => {
              resolve();
            });
          });
        }
        return Promise.resolve();
      }
      default: {
        return run(alfredConfig, subcommand, skillFlags);
      }
    }
  }

  /**
   * Validate the package.json of the Alfred project
   */
  validatePkgJson(pkgPath: string) {
    const result = PkgValidation.validate(fs.readFileSync(pkgPath).toString());

    // @TODO @REFACTOR: Move terminal coloring to cli
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

  checkIsAlfredProject() {
    const { config, interfaceStates } = this;
    const srcPath = path.join(config.root, 'src');

    this.validatePkgJson();

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
   * Delete .configs dir
   */
  deleteConfigs() {
    const configsBasePath = getConfigsBasePath(this.config.root);
    if (fs.existsSync(configsBasePath)) {
      return new Promise(resolve => {
        rimraf(configsBasePath, () => {
          resolve();
        });
      });
    }
    return Promise.resolve();
  }
}

export default function Alfred(projectDir) {
  return new AlfredConfig().init(projectDir);
}
