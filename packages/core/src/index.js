// @flow
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import rimraf from 'rimraf';
import pkgUp from 'pkg-up';
import { Signale } from 'signale';
import { getConfigsBasePath } from '@alfred/helpers';
import Config from './config';
import { PkgValidation } from './validation';
import { ENTRYPOINTS } from './ctf';
import { generateInterfaceStatesFromProject } from './interface';
import run from './commands/run';

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

export const getInstallCommmand = (config: Config): string => {
  const { root, alfredConfig } = config;
  const { npmClient } = alfredConfig;
  return npmClient.toLowerCase() === 'npm'
    ? `npm install --prefix ${root}`
    : 'yarn';
};

export class AlfredProject {
  config: Config;

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

  /**
   * Given an directory, find the ancestor in the directory tree that is the project root
   */
  async init(projectRootOrSubDir: ?string) {
    const projectRoot = this.searchProjectRoot(projectRootOrSubDir);
    const config = await Config.initFromProjectRoot(projectRoot);
    this.config = config;
    const interfaceStates = generateInterfaceStatesFromProject(config);
    this.checkIsAlfredProject(config, interfaceStates);
    return { ...config, projectRoot, run: this.run.bind(this) };
  }

  async run(subcommand, skillFlags) {
    const { config } = this;
    const nodeModulesPath = `${config.root}/node_modules`;
    // Install the modules if they are not installed if autoInstall: true
    // @TODO @HACK Note that this might cause issues in monorepos
    if (config.autoInstall === true && !fs.existsSync(nodeModulesPath)) {
      const installCommand = getInstallCommmand(config);
      childProcess.execSync(installCommand, {
        cwd: config.root,
        stdio: 'inherit'
      });
    }
    // $FlowFixMe
    module.paths.push(nodeModulesPath);

    await this.deleteConfigs();

    // Built in, non-overridable skills are added here
    switch (subcommand) {
      case 'clean': {
        const targetsPath = path.join(config.root, 'targets');
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
        return run(config, subcommand, skillFlags);
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

  checkIsAlfredProject(config, interfaceStates) {
    const srcPath = path.join(config.root, 'src');

    this.validatePkgJson(config.pkgPath);

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
   * Delete .configs dir of an alfred project
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

  // @TODO
  // installDeps() {}

  // @TODO
  // uninstallDeps() {}
}

export default function alfred(projectDir: ?string) {
  return new AlfredProject().init(projectDir);
}
