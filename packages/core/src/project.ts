import path from 'path';
import fs from 'fs';
import npm from 'npm';
import childProcess from 'child_process';
import formatPkg from 'format-package';
import { getConfigsBasePath, findProjectRoot } from '@alfred/helpers';
import mergeConfigs from '@alfred/merge-configs';
import {
  PkgJson,
  ConfigInterface,
  InterfaceState,
  ProjectInterface,
  ValidationResult,
  SkillsList,
  CtfMap,
  CtfNode,
  NpmClients,
  DependencyType,
  Dependencies
} from '@alfred/types';
import Config from './config';
import { PkgValidation } from './validation';
import ctfFromConfig, { ENTRYPOINTS } from './ctf';
import {
  generateInterfaceStatesFromProject,
  INTERFACE_STATES
} from './interface';
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

/**
 * Given an object with deps, return the deps as a list
 * Example:
 * pkgDepsToList({ react: 16 }) => ['react@16']
 */
export function pkgDepsToList(deps: Dependencies): string[] {
  return Array.from(Object.entries(deps)).map(
    ([dependency, semver]) => `${dependency}@${semver}`
  );
}

export function formatPkgJson(pkg: PkgJson): Promise<string> {
  return formatPkg(pkg, { order: PKG_SORT_ORDER });
}

export default class Project implements ProjectInterface {
  config: ConfigInterface;

  pkgPath: string;

  pkg: PkgJson;

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
      throw new Error(`
      The following errors were found in the package.json path:
      ${pkgPath}:

      ${JSON.stringify(result.errors)}
      `);
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

    const hasEntrypoint = ENTRYPOINTS.some(entryPoint =>
      fs.existsSync(path.join(srcPath, entryPoint))
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

  async installDeps(
    dependencies: Array<string>,
    dependenciesType: DependencyType,
    npmClient: NpmClients = this.config.npmClient
  ): Promise<void> {
    if (!dependencies.length) return;

    this.pkg = JSON.parse(fs.readFileSync(this.pkgPath).toString());

    switch (npmClient) {
      // Install dependencies with NPM, which is the default
      case 'npm': {
        await new Promise((resolve, reject) => {
          npm.load({ save: true, dev: dependenciesType === 'dev' }, err => {
            if (err) reject(err);

            npm.commands.install(dependencies, (_err, data) => {
              if (_err) reject(_err);
              resolve(data);
            });

            npm.on('log', console.log);
          });
        });
        break;
      }
      // Install dependencies with Yarn
      case 'yarn': {
        const devFlag = dependenciesType === 'dev' ? '--dev' : '';
        childProcess.execSync(
          ['yarn', 'add', devFlag, ...dependencies].join(' '),
          {
            cwd: this.root,
            stdio: 'inherit'
          }
        );
        break;
      }
      // Write the package to the package.json but do not install them. This is intended
      // to be used for end to end testing
      case 'writeOnly': {
        const newDependencies = dependencies
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

        // @TODO @HACK @BUG This is an incorrect usage of the Config API
        await Config.writeToPkgJson(
          this.pkgPath,
          mergeConfigs({}, this.pkg, {
            [dependenciesType === 'dev'
              ? 'devDependencies'
              : 'dependencies']: newDependencies
          })
        );
        break;
      }
      default: {
        throw new Error('Unsupported npm client. Can only be "npm" or "yarn"');
      }
    }

    this.pkg = JSON.parse(fs.readFileSync(this.pkgPath).toString());
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
    const configsBasePath = getConfigsBasePath(this, this.config);
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

  async findDepsToInstall(
    additionalCtfs: Array<CtfNode> = []
  ): Promise<{ dependencies: Dependencies; devDependencies: Dependencies }> {
    const ctfMaps = await Promise.all(
      INTERFACE_STATES.map(interfaceState =>
        ctfFromConfig(this, interfaceState, this.config)
      )
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const mergedCtfMap: CtfMap = new Map(...ctfMaps);

    const pkgDeps: {
      dependencies: Dependencies;
      devDependencies: Dependencies;
    } = [...mergedCtfMap.values(), ...additionalCtfs].reduce(
      (prev, curr) => ({
        dependencies: { ...prev.dependencies, ...curr.dependencies },
        devDependencies: { ...prev.devDependencies, ...curr.devDependencies }
      }),
      { dependencies: {}, devDependencies: {} }
    );

    const dependencies = Object.fromEntries(
      Object.entries(pkgDeps.dependencies).filter(
        ([dep]) => !(dep in (this.pkg.dependencies || {}))
      )
    );
    const devDependencies = Object.fromEntries(
      Object.entries(pkgDeps.devDependencies).filter(
        ([dep]) => !(dep in (this.pkg.devDependencies || {}))
      )
    );

    return {
      dependencies,
      devDependencies
    };
  }
}
