// @flow
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import rimraf from 'rimraf';
import { getConfigsBasePath, findProjectRoot } from '@alfred/helpers';
import { ValidationResult } from 'joi';
import Config from './config';
import { PkgValidation } from './validation';
import { ENTRYPOINTS } from './ctf';
import { generateInterfaceStatesFromProject } from './interface';
import run from './commands/run';
import learn from './commands/learn';
import clean from './commands/clean';
import type {
  Pkg,
  ConfigInterface,
  InterfaceState,
  ProjectInterface
} from './types';

// @TODO send the information to a crash reporting service (like sentry.io)
process.on('unhandledRejection', err => {
  throw err;
});

const getInstallCommmand = (project: ProjectInterface): string => {
  const { root, npmClient } = project.config;
  return npmClient.toLowerCase() === 'npm'
    ? `npm install --prefix ${root}`
    : 'yarn';
};

export default class Project implements ProjectInterface {
  config: ConfigInterface;

  pkgPath: string;

  pkg: Pkg;

  root: string;

  /**
   * Given an directory, find the ancestor in the directory tree that is the project root
   */
  async init(projectRootOrSubDir: string = process.cwd()): Promise<Project> {
    const projectRoot = findProjectRoot(projectRootOrSubDir);

    this.root = projectRoot;
    this.pkgPath = path.join(projectRoot, 'package.json');
    this.pkg = JSON.parse(fs.readFileSync(this.pkgPath).toString());
    this.config = await Config.initFromProjectRoot(projectRoot);

    const interfaceStates = generateInterfaceStatesFromProject(this);
    this.checkIsAlfredProject(this.config, interfaceStates);

    return this;
  }

  setConfig(config: ConfigInterface): Project {
    this.config = config;
    return this;
  }

  async run(subcommand: string, args: Array<string>) {
    const { config } = this;
    const nodeModulesPath = `${this.root}/node_modules`;
    // Install the modules if they are not installed if autoInstall: true
    // @TODO @HACK Note that this might cause issues in monorepos
    if (config.autoInstall === true && !fs.existsSync(nodeModulesPath)) {
      const installCommand = getInstallCommmand(this);
      childProcess.execSync(installCommand, {
        cwd: this.root,
        stdio: 'inherit'
      });
    }
    // $FlowFixMe
    module.paths.push(nodeModulesPath);

    await this.deleteConfigs();

    // Built in, non-overridable skills are added here
    // 'start' subcommand is handled by run()
    // @TODO: Make all skills overridable but warn before overriding them
    switch (subcommand) {
      case 'clean': {
        return clean(this);
      }
      case 'learn': {
        return learn(this, args);
      }
      default: {
        return run(this, subcommand, args);
      }
    }
  }

  /**
   * Validate the package.json of the Alfred project
   */
  validatePkgJson(): ValidationResult {
    const { pkgPath } = this.config;
    const result = PkgValidation.validate(fs.readFileSync(pkgPath).toString());

    if (result.errors.length) {
      throw new Error(result.errors);
    }

    return result;
  }

  checkIsAlfredProject(
    config: ConfigInterface,
    interfaceStates: Array<InterfaceState>
  ) {
    const srcPath = path.join(this.root, 'src');
    const validationResult = this.validatePkgJson();

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

    return validationResult;
  }

  /**
   * Delete .configs dir of an alfred project
   */
  deleteConfigs(): Promise<void> {
    const configsBasePath = getConfigsBasePath(this.root);
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
