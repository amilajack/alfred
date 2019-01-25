// @flow
/* eslint import/no-dynamic-require: off, no-param-reassign: off */
import mergeConfigs from '@alfredpkg/merge-configs';
import type { AlfredConfig } from '@alfredpkg/cli';

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
  if (!config.extends.length) {
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

export default function Config(config: AlfredConfig = {}): AlfredConfig {
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

  return getConfigs(config);
}
