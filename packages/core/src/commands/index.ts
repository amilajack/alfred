/* eslint import/no-dynamic-require: off */
import path from 'path';
import { getConfigsBasePath } from '@alfred/helpers';
import {
  ProjectInterface,
  CtfMap,
  InterfaceState,
  ConfigValue,
  SkillInterfaceModule,
  CtfNode
} from '@alfred/types';

export function getInterfaceForSubcommand(
  ctfMap: CtfMap,
  subcommand: string
): SkillInterfaceModule {
  const interfaceForSubcommand = Array.from(ctfMap.values())
    .filter(
      (ctfNode: CtfNode) => ctfNode.interfaces && ctfNode.interfaces.length
    )
    .map((ctfNode: CtfNode): SkillInterfaceModule[] =>
      ctfNode.interfaces.map(e => require(e.name))
    )
    .flat()
    .find(
      (ctfInterface: SkillInterfaceModule) =>
        ctfInterface.subcommand === subcommand
    );

  if (!interfaceForSubcommand) {
    throw new Error(
      `The subcommand "${subcommand}" does not have an interface or the subcommand does not exist`
    );
  }

  return interfaceForSubcommand;
}

type SubcommandFn = (flags: Array<string>) => void;

export type ExecutableSkillMethods = {
  [subcommand: string]: SubcommandFn;
};

export function getExecutableWrittenConfigsMethods(
  project: ProjectInterface,
  ctf: CtfMap,
  interfaceState: InterfaceState
): ExecutableSkillMethods {
  const { config } = project;
  const configWithDefaults = config.getConfigWithDefaults();
  const configsBasePath = getConfigsBasePath(project, config);
  const skillsConfigMap: Map<string, ConfigValue> = new Map(
    configWithDefaults.skills.map(([skillPkgName, skillConfig]) => [
      require(skillPkgName).name,
      skillConfig
    ])
  );

  return (
    Array.from(ctf.values())
      .filter(
        ctfNode =>
          ctfNode.hooks && ctfNode.interfaces && ctfNode.interfaces.length
      )
      .map(ctfNode => {
        const configFiles = ctfNode.configFiles.map(configFile => ({
          ...configFile,
          path: path.join(configsBasePath, configFile.path)
        }));
        return ctfNode.interfaces.map(ctfInterface => {
          const { subcommand } = require(ctfInterface.name);
          const skillConfig = skillsConfigMap.get(ctfNode.name) as ConfigValue;
          return {
            fn: (flags: Array<string> = []): void =>
              ctfNode.hooks.call({
                project,
                config,
                configFiles,
                ctf,
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
      .flat()
      // @TODO @REFACTOR This is messy
      .reduce(
        (
          p: ExecutableSkillMethods,
          c: { subcommand: string; fn: SubcommandFn }
        ): ExecutableSkillMethods => ({
          ...p,
          [c.subcommand]: c.fn
        }),
        {}
      )
  );
}
