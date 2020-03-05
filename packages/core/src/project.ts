import path from 'path';
import fs from 'fs';
import npm from 'npm';
import formatPkg from 'format-package';
import prettier from 'prettier';
import pkgUp from 'pkg-up';
import {
  getConfigsBasePath,
  execCmdInProject,
  configToEvalString,
  serialPromises
} from '@alfred/helpers';
import mergeConfigs from '@alfred/merge-configs';
import {
  PkgJson,
  ConfigInterface,
  ProjectInterface,
  ValidationResult,
  SkillsList,
  SkillMap,
  NpmClients,
  DependencyType,
  Dependencies,
  PkgWithDeps,
  Env,
  ProjectEnum,
  Platform,
  Target,
  Skill,
  Entrypoint,
  LearnEvent,
  NewEvent,
  SkillConfig,
  RunEvent,
  HookEvent
} from '@alfred/types';
import loadJsonFile from 'load-json-file';
import Config from './config';
import { PkgValidation } from './validation';
import skillMapFromConfig, { requireSkill } from './skill';
import run from './commands/run';
import learn from './commands/learn';
import skills from './commands/skills';
import clean from './commands/clean';
import { PKG_SORT_ORDER, RAW_ENTRYPOINTS } from './constants';
import { EventEmitter } from 'events';

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

export function parseEntrypoint(rawEntrypoint: string): Entrypoint {
  const [project, platform] = rawEntrypoint.split('.') as [
    ProjectEnum,
    Platform
  ];
  return { project, platform, filename: rawEntrypoint };
}

export function entrypointToTarget(entrypoint: Entrypoint, env: Env): Target {
  return {
    platform: entrypoint.platform,
    project: entrypoint.project,
    env
  };
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

export function formatPkgJson(pkg: PkgJson): Promise<string> {
  return formatPkg(pkg, { order: PKG_SORT_ORDER });
}

export default class Project extends EventEmitter implements ProjectInterface {
  config: ConfigInterface;

  pkgPath: string;

  pkg: PkgJson;

  root: string;

  entrypoints: Entrypoint[];

  targets: Target[];

  constructor(projectRootOrSubDir: string = process.cwd()) {
    super();
    const projectRoot = findProjectRoot(projectRootOrSubDir);

    this.root = projectRoot;
    this.pkgPath = path.join(projectRoot, 'package.json');
    this.pkg = loadJsonFile.sync(this.pkgPath);
    this.config = Config.initFromProjectRoot(projectRoot);
    this.entrypoints = this.getEntrypoints();
    this.targets = this.getTargets();
  }

  private getEntrypoints(): Entrypoint[] {
    return RAW_ENTRYPOINTS.filter(entryPoint =>
      fs.existsSync(path.join(this.root, 'src', entryPoint))
    ).map(parseEntrypoint);
  }

  private getTargets(): Array<Target> {
    const envs: Array<string> = ['production', 'development', 'test'];
    // Default to development env if no config given
    const env: Env = envs.includes(process.env.NODE_ENV || '')
      ? (process.env.NODE_ENV as Env)
      : 'development';
    return this.entrypoints.map(entrypoint =>
      entrypointToTarget(entrypoint, env)
    );
  }

  async emitAsync(eventName: string, eventData?: HookEvent): Promise<void> {
    const tasks = this.listeners(eventName).map(event => {
      return async (): Promise<void> => {
        if (eventData) {
          await event(eventData);
        } else {
          await event();
        }
      };
    });
    await serialPromises(tasks);
  }

  async init(): Promise<ProjectInterface> {
    this.checkProjectIsValid();

    const skillMap = await this.getSkillMap();
    skillMap.forEach(skill => {
      Object.entries(skill.hooks || {}).forEach(([hookName, hookFn]) => {
        this.on(hookName, (event = {}): Promise<void> | void => {
          if (!hookFn) return;
          hookFn({
            event,
            project: this,
            config: this.config,
            targets: this.targets,
            skill,
            skillMap
          });
        });
      });
    });

    // Write all files of newly learned skills
    ['afterNew', 'afterLearn', 'beforeRun'].forEach(hookName => {
      this.on(hookName, async (event: NewEvent | LearnEvent | RunEvent) => {
        await this.writeSkillConfigs(skillMap);
        if ('skillsPkgNames' in event) {
          await this.writeSkillFiles(event.skillsPkgNames.map(requireSkill));
        }
      });
    });

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
    const capitalizedCmd = `${subcommand[0].toUpperCase()}${subcommand.slice(
      1
    )}`;
    await this.emitAsync(`before${capitalizedCmd}`);
    switch (subcommand) {
      case 'clean': {
        await this.clean();
        break;
      }
      case 'skills': {
        await this.skills();
        break;
      }
      case 'learn': {
        await this.learn(args);
        break;
      }
      default: {
        await this.beforeCommand();
        await run(this, subcommand, args);
        break;
      }
    }
    await this.emitAsync(`after${capitalizedCmd}`);
  }

  learn(skillPkgNames: string[]): Promise<void> {
    return learn(this, skillPkgNames);
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
      console.warn(
        `The following errors were found in the package.json path:
${pkgPath}:

${JSON.stringify(result.errors)}`
      );
    }

    return result;
  }

  private checkProjectIsValid(): ValidationResult {
    const srcPath = path.join(this.root, 'src');
    const validationResult = this.validatePkgJson();

    if (!fs.existsSync(srcPath)) {
      throw new Error(
        '"./src" directory does not exist. This does not seem to be an Alfred project'
      );
    }

    const hasEntrypoint = this.entrypoints.length > 0;

    if (!hasEntrypoint) {
      throw new Error(
        `You might be in the wrong directory or this is not an Alfred project. The project must have at least one entrypoint. Here are some examples of entrypoints:\n\n${RAW_ENTRYPOINTS.map(
          e => `"./src/${e}"`
        ).join('\n')} \n\n Searching from ${this.root}\n\n`
      );
    }

    // Run validation that is specific to each target
    if (
      this.entrypoints.some(
        entrypoint => entrypoint.filename === 'app.browser.js'
      )
    ) {
      const indexHtmlPath = path.join(srcPath, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) {
        throw new Error(
          'An "./src/index.html" file must exist when targeting a browser environment'
        );
      }
    }

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

    await this.updatePkg();

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
        await Config.writeObjToPkgJson(
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

    await this.updatePkg();
  }

  async updatePkg(): Promise<void> {
    this.pkg = await loadJsonFile(this.pkgPath);
  }

  /**
   * @TODO
   */
  // uninstallDeps() {}

  /**
   * Get a skillMap that has all the skills used in all targets
   */
  async getSkillMap(): Promise<SkillMap> {
    return skillMapFromConfig(this);
  }

  async writeSkillFiles(skills: Skill[]): Promise<void> {
    await Promise.all(skills.map(skill => skill.files.writeAllFiles(this)));
  }

  async writeSkillConfigs(skillMap: SkillMap): Promise<void> {
    // Create a .configs dir if it doesn't exist
    const configsBasePath = getConfigsBasePath(this);
    if (!fs.existsSync(configsBasePath)) {
      fs.mkdirSync(configsBasePath);
    }

    const skills: Skill[] = Array.from(skillMap.values());
    const pkgConfigEntries: Array<[string, SkillConfig['config']]> = [];

    // Write all configs
    await Promise.all(
      skills
        .flatMap(skill => Array.from(skill.configs.values()))
        .map(async config => {
          const filePath = path.join(configsBasePath, config.filename);

          switch (config.write) {
            case false:
              break;
            case 'pkg': {
              if (typeof config.pkgProperty === 'string') {
                pkgConfigEntries.push([config.pkgProperty, config.config]);
                // If the file happens to exist, delete it. User shouldn't have two configs in
                // pkg and config file
                if (fs.existsSync(filePath)) {
                  await fs.promises.unlink(filePath);
                }
              }
              break;
            }
            case 'file': {
              if (
                typeof config.pkgProperty === 'string' &&
                config.pkgProperty in this.pkg
              ) {
                delete this.pkg[config.pkgProperty];
              }

              const stringifiedConfig = JSON.stringify(config.config);

              // Otherwises, format the config and write it to its filepath
              let parser: 'babel' | 'json' = 'babel';
              const configWithExports = ((): string => {
                switch (config.fileType) {
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
              const formattedConfig = prettier.format(
                configToEvalString(configWithExports),
                {
                  parser
                }
              );
              await fs.promises.writeFile(filePath, formattedConfig);
              break;
            }
          }
        })
    );

    if (pkgConfigEntries.length) {
      await this.updatePkg();
      await Config.writeObjToPkgJson(
        this.pkgPath,
        Object.fromEntries(pkgConfigEntries),
        this.pkg
      );
    }
  }

  async findDepsToInstall(
    additionalSkills: Array<Skill> = []
  ): Promise<PkgWithDeps> {
    const skillMap = await this.getSkillMap();

    const pkgDeps: PkgWithDeps = [
      ...skillMap.values(),
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
