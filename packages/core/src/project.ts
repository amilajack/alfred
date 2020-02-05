import path from 'path';
import fs from 'fs';
import npm from 'npm';
import formatPkg from 'format-package';
import prettier from 'prettier';
import pkgUp from 'pkg-up';
import {
  getConfigsBasePath,
  execCmdInProject,
  configParse
} from '@alfred/helpers';
import mergeConfigs from '@alfred/merge-configs';
import {
  PkgJson,
  ConfigInterface,
  InterfaceState,
  ProjectInterface,
  ValidationResult,
  SkillsList,
  SkillMap,
  SkillNode,
  NpmClients,
  DependencyType,
  Dependencies,
  PkgWithDeps
} from '@alfred/types';
import Config from './config';
import { PkgValidation } from './validation';
import skillMapFromConfig, { ENTRYPOINTS } from './skill';
import { getInterfaceStatesFromProject, INTERFACE_STATES } from './interface';
import run from './commands/run';
import learn from './commands/learn';
import skills from './commands/skills';
import clean from './commands/clean';
import { PKG_SORT_ORDER } from './constants';

// @TODO Send the information to a crash reporting service (like sentry.io)
// @TODO Install sourcemaps
process.on('unhandledRejection', err => {
  throw err;
});

/**
 * Get the root of a project from the current working directory
 */
function findProjectRoot(startingSearchDir: string = process.cwd()): string {
  const pkgPath = pkgUp.sync({
    cwd: startingSearchDir
  });
  if (!pkgPath) {
    throw new Error(
      `Alfred project root could not be found from "${startingSearchDir}".

      Make sure you are inside an Alfred project.`
    );
  }
  return path.dirname(pkgPath);
}

function getInstallCommmand(project: ProjectInterface): string {
  const { root } = project;
  const { npmClient } = project.config;
  return npmClient.toLowerCase() === 'npm'
    ? `npm install --prefix ${root}`
    : 'yarn';
}

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

export function formatPkgJson(pkg: Record<string, any>): Promise<string> {
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

    const interfaceStates = getInterfaceStatesFromProject(this);
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

  /**
   * Find the dependencies that the user is missing in their package.json and write
   * them to the package.json
   */
  private async writeMissingDeps(): Promise<void> {
    const { dependencies, devDependencies } = await this.findDepsToInstall();
    await this.installDeps(dependencies, 'dep', 'writeOnly');
    await this.installDeps(devDependencies, 'dev', 'writeOnly');
  }

  /**
   * Install the modules if they are not installed if autoInstall: true
   * @TODO @HACK Note that this might cause issues in monorepos
   */
  private autoInstallDeps(): void {
    const { config } = this;
    const nodeModulesPath = `${this.root}/node_modules`;
    module.paths.push(nodeModulesPath);

    if (config.autoInstall === true && !fs.existsSync(nodeModulesPath)) {
      const installCommand = getInstallCommmand(this);
      execCmdInProject(this, installCommand);
    }
  }

  /**
   * A list of things to do before running any command
   */
  async beforeCommand(): Promise<void> {
    await this.writeMissingDeps();
    this.autoInstallDeps();
  }

  async run(
    subcommand: string,
    args: Array<string> = []
  ): Promise<void | SkillsList> {
    // Built in, non-overridable skills are added here
    // 'start' subcommand is handled by run()
    // @TODO: Make all skills overridable but warn before overriding them
    switch (subcommand) {
      case 'clean': {
        return this.clean();
      }
      case 'skills': {
        return this.skills();
      }
      case 'learn': {
        return this.learn(args);
      }
      default: {
        await this.beforeCommand();
        return run(this, subcommand, args);
      }
    }
  }

  learn(args: string[]): Promise<void> {
    return learn(this, args);
  }

  async clean(): Promise<void> {
    await this.beforeCommand();
    return clean(this);
  }

  async skills(): Promise<SkillsList> {
    await this.beforeCommand();
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

  private checkIsAlfredProject(
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
    dependencies: string[] | Dependencies,
    dependenciesType: DependencyType,
    npmClient: NpmClients = this.config.npmClient
  ): Promise<void> {
    const normalizedDeps = Array.isArray(dependencies)
      ? dependencies
      : pkgDepsToList(dependencies);

    if (!normalizedDeps.length) return;

    this.pkg = JSON.parse(fs.readFileSync(this.pkgPath).toString());

    const npmClientWithOverride =
      process.env.ALFRED_IGNORE_INSTALL === 'true' ? 'writeOnly' : npmClient;

    switch (npmClientWithOverride) {
      // Install dependencies with NPM, which is the default
      case 'npm': {
        await new Promise((resolve, reject) => {
          npm.load({ save: true, dev: dependenciesType === 'dev' }, err => {
            if (err) reject(err);

            npm.commands.install(normalizedDeps, (_err, data) => {
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
        execCmdInProject(
          this,
          ['yarn', 'add', devFlag, ...normalizedDeps].join(' ')
        );
        break;
      }
      // Write the package to the package.json but do not install them. This is intended
      // to be used for end to end testing
      case 'writeOnly': {
        const newDependencies = normalizedDeps
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
        await Config.writeObjToPkgJsonConfig(
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

  skillMapFromInterfaceState(
    interfaceState: InterfaceState,
    config: ConfigInterface = this.config
  ): Promise<SkillMap> {
    return skillMapFromConfig(this, interfaceState, config);
  }

  async writeConfigsFromSkillMap(skillMap: SkillMap): Promise<SkillMap> {
    if (!this.config.showConfigs) return skillMap;

    // Create a .configs dir if it doesn't exist
    const configsBasePath = getConfigsBasePath(this);
    if (!fs.existsSync(configsBasePath)) {
      fs.mkdirSync(configsBasePath);
    }

    const skills: SkillNode[] = Array.from(skillMap.values());

    await Promise.all(
      skills
        .filter(skill => skill.configFiles && skill.configFiles.length)
        .flatMap(skill => skill.configFiles)
        .map(async configFile => {
          const filePath = path.join(configsBasePath, configFile.path);
          // Write sync to prevent data races when writing configs in parallel
          const stringifiedConfig = JSON.stringify(configFile.config);
          let parser: 'babel' | 'json' = 'babel';
          const configInConfigFileFormat = ((): string => {
            switch (configFile.configType) {
              case 'commonjs':
                parser = 'babel';
                return `module.exports = ${stringifiedConfig}`;
              case 'module':
                parser = 'babel';
                return `export default ${stringifiedConfig}`;
              case 'json':
                parser = 'json';
                return stringifiedConfig;
              default:
                parser = 'babel';
                return `module.exports = ${stringifiedConfig}`;
            }
          })();
          return fs.promises.writeFile(
            filePath,
            prettier.format(configParse(configInConfigFileFormat), {
              parser
            })
          );
        })
    );

    return skillMap;
  }

  async findDepsToInstall(
    additionalSkills: Array<SkillNode> = []
  ): Promise<PkgWithDeps> {
    const skillMaps = await Promise.all(
      INTERFACE_STATES.map(interfaceState =>
        skillMapFromConfig(this, interfaceState, this.config)
      )
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const mergedSkillMap: SkillMap = new Map(...skillMaps);

    const pkgDeps: PkgWithDeps = [
      ...mergedSkillMap.values(),
      ...additionalSkills
    ].reduce(
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
