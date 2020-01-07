/* eslint import/no-dynamic-require: off */
import path from 'path';
import { getConfigsBasePath } from '@alfred/helpers';
import type {
  CtfMap,
  ConfigInterface,
  InterfaceState,
  ConfigValue
} from '../types';

export function getInterfaceForSubcommand(ctf: CtfMap, subcommand: string) {
  const interfaceForSubcommand = Array.from(ctf.values())
    .filter(
      ctfNode =>
        ctfNode.hooks && ctfNode.interfaces && ctfNode.interfaces.length
    )
    .reduce(
      (arr, ctfNode) =>
        arr.concat(ctfNode.interfaces.map(e => require(e.name))),
      []
    )
    .find(ctfInterface => ctfInterface.subcommand === subcommand);

  if (!interfaceForSubcommand) {
    throw new Error(
      `The subcommand "${subcommand}" does not have an interface or the subcommand does not exist`
    );
  }

  return interfaceForSubcommand;
}

export type ExecutableSkillMethods = {
  [subcommand: string]: (config: ConfigInterface, flags: Array<string>) => void
};

export function getExecutableWrittenConfigsMethods(
  config: ConfigInterface,
  ctf: CtfMap,
  interfaceState: InterfaceState
): ExecutableSkillMethods {
  const alfredConfig = config.getConfigWithDefaults();
  const configsBasePath = getConfigsBasePath(config.root);
  const skillsConfigMap: Map<string, ConfigValue> = new Map(
    alfredConfig.skills.map(([skillPkgName, skillConfig]) => [
      require(skillPkgName).name,
      skillConfig
    ])
  );

  return Array.from(ctf.values())
    .filter(
      ctfNode =>
        ctfNode.hooks && ctfNode.interfaces && ctfNode.interfaces.length
    )
    .reduce((prev, curr) => prev.concat(curr), [])
    .map(ctfNode => {
      const configFiles = ctfNode.configFiles.map(configFile => ({
        ...configFile,
        path: path.join(configsBasePath, configFile.path)
      }));
      return ctfNode.interfaces.map(e => {
        const { subcommand } = require(e.name);
        const skillConfig = skillsConfigMap.get(ctfNode.name);
        return {
          fn: (_config: ConfigInterface, flags: Array<string> = []) =>
            ctfNode.hooks.call({
              configFiles,
              ctf,
              config,
              alfredConfig,
              interfaceState,
              subcommand,
              flags,
              skillConfig
            }),
          // @HACK: If interfaces were defined, we could import the @alfred/interface-*
          //        and use the `subcommand` property. This should be done after we have
          //        some interfaces to work with
          subcommand
        };
      });
    })
    .reduce((p, c) => p.concat(c), [])
    .reduce(
      (p, c) => ({
        ...p,
        [c.subcommand]: c.fn
      }),
      {}
    );
}
