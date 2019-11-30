/* eslint import/no-dynamic-require: off, no-param-reassign: off */
import path from 'path';
import fs from 'fs';
import formatPkg from 'format-package';
import mergeConfigs from '@alfred/merge-configs';
import Validate from './validation';

export type AlfredConfig = {
  extends?: Array<string> | string,
  npmClient: 'npm' | 'yarn',
  skills: Array<string | [string, Object]>,
  root: string,
  showConfigs: boolean
};

export function requireConfig(configName: string): any {
  try {
    // $FlowFixMe
    return require(`alfred-config-${configName}`);
  } catch (e) {
    try {
      // $FlowFixMe
      return require(configName);
    } catch (_e) {
      throw new Error(
        `Could not resolve "${configName}" module or "eslint-config-${configName}" module`
      );
    }
  }
}

export function getConfigs(config: AlfredConfig = {}): AlfredConfig {
  if (!config.extends) return config;
  if (!Array.isArray(config.extends) && typeof config.extends !== 'string') {
    throw new Error('.extends property must be an Array or a string');
  }
  // Convert extends: 'my-config' to extends: ['my-config']
  if (typeof config.extends === 'string') {
    config.extends = [config.extends];
  }
  // If a config is a string, require it
  const normalizedConfigs = config.extends.map(_config =>
    // $FlowFixMe
    typeof _config === 'string' ? requireConfig(_config) : _config
  );
  // If nothing to extend then return the config itself without the extends
  // property
  if (config.extends && !config.extends.length) {
    const newConfig = { ...config };
    delete newConfig.extends;
    return newConfig;
  }

  for (let i = 0; i < normalizedConfigs.length; i += 1) {
    // eslint-disable-next-line no-param-reassign
    normalizedConfigs[i] = getConfigs(normalizedConfigs[i]);
  }

  const mergedConfig = mergeConfigs(
    {},
    ...normalizedConfigs.map(e => e),
    config
  );
  delete mergedConfig.extends;
  return mergedConfig;
}

function validate(config: AlfredConfig): AlfredConfig {
  if (!config.extends) return config;
  // Validate if each config in `.extends` is a string
  if (Array.isArray(config.extends)) {
    config.extends.forEach(_config => {
      if (typeof _config !== 'string') {
        throw new Error(
          `Values in ".extends" property in Alfred config must be a string. Instead passed ${JSON.stringify(
            config.extends
          )}`
        );
      }
    });
  } else if (typeof config.extends !== 'string') {
    throw new Error(
      `Values in ".extends" property in Alfred config must be a string. Instead passed ${JSON.stringify(
        config.extends
      )}`
    );
  }
  return config;
}

export type ConfigSkillType = [string, any] | string;
type ConfigMap = Map<string, any>;

/**
 * @TODO @REFACTOR This function is not used outside of this module. Consider
 *                 not using it as the default export
 */
export default function Config(config: AlfredConfig): AlfredConfig {
  validate(config);

  const mergedConfig = getConfigs(config);
  if (!mergedConfig.skills || !mergedConfig.skills.length) return mergedConfig;

  const skillsMap: ConfigMap = new Map();
  const mappedSkills: ConfigMap = mergedConfig.skills.reduce(
    (map: ConfigMap, skill: ConfigSkillType) => {
      if (typeof skill === 'string') {
        map.set(skill, {});
        return map;
      }
      if (Array.isArray(skill)) {
        const [skillName, skillConfig] = skill;
        if (map.has(skillName)) {
          map.set(skillName, mergeConfigs({}, map.get(skillName), skillConfig));
        } else {
          map.set(skillName, skillConfig);
        }
        return map;
      }
      throw new Error(`Config type not supported: ${JSON.stringify(skill)}`);
    },
    skillsMap
  );

  mergedConfig.skills = Array.from(mappedSkills.entries());

  return mergedConfig;
}

const PKG_SORT_ORDER = [
  'name',
  'version',
  'private',
  'description',
  'keywords',
  'homepage',
  'bugs',
  'repository',
  'license',
  'author',
  'contributors',
  'files',
  'sideEffects',
  'main',
  'module',
  'jsnext:main',
  'browser',
  'types',
  'typings',
  'style',
  'example',
  'examplestyle',
  'assets',
  'bin',
  'man',
  'directories',
  'workspaces',
  'scripts',
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'bundledDependencies',
  'bundleDependencies',
  'optionalDependencies',
  'resolutions',
  'engines',
  'engineStrict',
  'os',
  'cpu',
  'preferGlobal',
  'publishConfig',
  'betterScripts',
  'husky',
  'pre-commit',
  'commitlint',
  'lint-staged',
  'config',
  'nodemonConfig',
  'browserify',
  'babel',
  'browserslist',
  'xo',
  'prettier',
  'eslintConfig',
  'eslintIgnore',
  'stylelint',
  'jest',
  '...rest'
];

export type Pkg = { [x: string]: string };

export function formatPkgJson(pkg: Pkg): Promise<string> {
  return formatPkg(pkg, { order: PKG_SORT_ORDER });
}

/**
 * Writes an Alfred config to a user's package.json
 * @REFACTOR This should focus on only writing the alfred config, not the whole
 *           package.json
 */
export async function writeConfig(pkgPath: string, pkg: Pkg): AlfredConfig {
  const formattedPkg = await formatPkgJson(pkg);
  await fs.promises.writeFile(pkgPath, formattedPkg);
  return formattedPkg;
}

/**
 * @TODO @REFACTOR Make this the default exported function and rename it to Configs
 */
export async function loadConfig(
  projectRoot: string,
  pkgPath: string = path.join(projectRoot, 'package.json')
): Promise<{ pkg: Pkg, pkgPath: string, alfredConfig: AlfredConfig }> {
  if (!fs.existsSync(pkgPath)) {
    throw new Error('Current working directory does not have "package.json"');
  }

  // Read the package.json and validate the Alfred config
  const pkg = JSON.parse((await fs.promises.readFile(pkgPath)).toString());
  const rawAlfredConfig = pkg.alfred || {};
  Validate(rawAlfredConfig || {});
  // Format the config
  await writeConfig(pkgPath, pkg);

  const defaultOpts = {
    npmClient: 'npm',
    skills: [],
    root: projectRoot
  };

  const alfredConfig = Config({ ...defaultOpts, ...rawAlfredConfig });

  return { pkg, pkgPath, alfredConfig };
}
