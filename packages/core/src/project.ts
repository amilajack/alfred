import path from 'path';
import fs from 'fs';
import npm from 'npm';
import childProcess from 'child_process';
import rimraf from 'rimraf';
import formatPkg from 'format-package';
import { getConfigsBasePath, findProjectRoot } from '@alfred/helpers';
import {
  Pkg,
  ConfigInterface,
  InterfaceState,
  ProjectInterface,
  ValidationResult,
  SkillsList,
  CtfMap,
  CtfNode,
  NpmClients
} from '@alfred/types';
import Config from './config';
import { PkgValidation } from './validation';
import ctfFromConfig, { ENTRYPOINTS } from './ctf';
import { generateInterfaceStatesFromProject } from './interface';
import run from './commands/run';
import learn from './commands/learn';
import skills from './commands/skills';
import clean from './commands/clean';
import { PKG_SORT_ORDER } from './constants';

// @TODO send the information to a crash reporting service (like sentry.io)
process.on('unhandledRejection', err => {
  throw err;
});

const getInstallCommmand = (project: ProjectInterface): string => {
  const { root } = project;
  const { npmClient } = project.config;
  return npmClient.toLowerCase() === 'npm'
    ? `npm install --prefix ${root}`
    : 'yarn';
};

export function formatPkgJson(pkg: Pkg): Promise<string> {
  return formatPkg(pkg, { order: PKG_SORT_ORDER });
}

export default class Project implements ProjectInterface {
  config: ConfigInterface;

  pkgPath: string;

  pkg: Pkg;

  root: string;

  constructor(projectRootOrSubDir: string = process.cwd()) {
    const projectRoot = findProjectRoot(projectRootOrSubDir);

    this.root = projectRoot;
    this.pkgPath = path.join(projectRoot, 'package.json');
    this.pkg = JSON.parse(fs.readFileSync(this.pkgPath).toString());
    this.config = Config.initFromProjectRoot(projectRoot);

    const interfaceStates = generateInterfaceStatesFromProject(this);
    this.checkIsAlfredProject(interfaceStates);

    return this;
  }

  static validatePkgPath(pkgPath: string): void {
    if (!fs.existsSync(pkgPath)) {
      throw new Error(`"${pkgPath}" does not exist`);
    }
  }

  setConfig(config: ConfigInterface): Project {
    this.config = config;
    return this;
  }

  async run(
    subcommand: string,
    args: Array<string> = []
  ): Promise<void | SkillsList> {
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

  learn(args: string[]): Promise<void> {
    return learn(this, args);
  }

  clean(): Promise<void> {
    return clean(this);
  }

  skills(): Promise<SkillsList> {
    return skills(this);
  }

  /**
   * Validate the package.json of the Alfred project
   */
  validatePkgJson(): ValidationResult {
    const { pkgPath } = this;
    const result = PkgValidation.validate(fs.readFileSync(pkgPath).toString());

    if (result.errors.length) {
      throw new Error(JSON.stringify(result.errors));
    }

    return result;
  }

  checkIsAlfredProject(
    interfaceStates: Array<InterfaceState>
  ): ValidationResult {
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

  async installDeps(
    dependencies: Array<string>,
    npmClient: NpmClients = this.config.npmClient
  ): Promise<any> {
    if (!dependencies.length) return;

    switch (npmClient) {
      // Install dependencies with NPM, which is the default
      case 'npm': {
        return new Promise((resolve, reject) => {
          npm.load({ save: true }, err => {
            if (err) reject(err);

            npm.commands.install(dependencies, (_err, data) => {
              if (_err) reject(_err);
              resolve(data);
            });

            npm.on('log', console.log);
          });
        });
      }
      // Install dependencies with Yarn
      case 'yarn': {
        return childProcess.execSync(
          ['yarn', 'add', ...dependencies].join(' '),
          {
            cwd: this.root,
            stdio: 'inherit'
          }
        );
      }
      // Write the package to the package.json but do not install them. This is intended
      // to be used for end to end testing
      case 'writeOnly': {
        const { dependencies: currentDependencies = {} } = this.pkg;
        const dependenciesAsObject = dependencies
          .map(dependency => {
            if (dependency[0] !== '@') {
              return dependency.split('@');
            }
            // A temporary hack that handles scoped npm packages. A proper solution would be
            // using a semver parser. Package names come in the following form: ['@a/b@1.2.3', 'a@latest', ...].
            // Temporarily remove the scope so we can split the package name
            const pkgWithoutScope = dependency.slice(1).split('@');
            // Then add it back
            return [`@${pkgWithoutScope[0]}`, pkgWithoutScope[1]];
          })
          .map(([p, c]) => ({ [p]: c }))
          .reduce((p, c) => ({ ...p, ...c }), {});
        const newDependencies = {
          ...currentDependencies,
          ...dependenciesAsObject
        };
        // @TODO @HACK @BUG This is an incorrect usage of the Config API
        return Config.writeToPkgJson(this.pkgPath, {
          dependencies: newDependencies
        });
      }
      default: {
        throw new Error('Unsupported npm client. Can only be "npm" or "yarn"');
      }
    }
  }

  /**
   * @TODO
   */
  // uninstallDeps() {}

  ctfFromInterfaceState(
    interfaceState: InterfaceState,
    config: ConfigInterface = this.config
  ): Promise<CtfMap> {
    return ctfFromConfig(this, interfaceState, config);
  }

  async writeConfigsFromCtf(ctf: CtfMap): Promise<CtfMap> {
    if (!this.config.showConfigs) return ctf;

    // Create a .configs dir if it doesn't exist
    const configsBasePath = getConfigsBasePath(this.root);
    if (!fs.existsSync(configsBasePath)) {
      fs.mkdirSync(configsBasePath);
    }

    const ctfNodes: CtfNode[] = Array.from(ctf.values());

    await Promise.all(
      ctfNodes
        .filter(ctfNode => ctfNode.configFiles && ctfNode.configFiles.length)
        .flatMap(ctfNode => ctfNode.configFiles)
        .map(async configFile => {
          const filePath = path.join(configsBasePath, configFile.path);
          const stringifiedConfig =
            typeof configFile.config === 'string'
              ? configFile.config
              : await formatPkg(configFile.config);
          // Write sync to prevent data races when writing configs in parallel
          const normalizedJsonOrModule =
            configFile.configValue === 'module'
              ? `module.exports = ${stringifiedConfig};`
              : stringifiedConfig;
          fs.writeFileSync(filePath, normalizedJsonOrModule);
        })
    );

    return ctf;
  }
}
