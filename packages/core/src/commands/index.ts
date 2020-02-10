/* eslint import/no-dynamic-require: off */
import path from 'path';
import { getConfigsBasePath } from '@alfred/helpers';
import {
  ProjectInterface,
  SkillMap,
  InterfaceState,
  ConfigValue,
  SkillInterfaceModule,
  SkillNode,
  HookFn
} from '@alfred/types';

export function getSkillInterfaceForSubcommand(
  skillMap: SkillMap,
  subcommand: string
): SkillInterfaceModule {
  const interfaceForSubcommand = Array.from(skillMap.values())
    .filter(
      (skillNode: SkillNode) =>
        skillNode.interfaces && skillNode.interfaces.length
    )
    .flatMap((skillNode: SkillNode): SkillInterfaceModule[] =>
      skillNode.interfaces.map(skillInterface => require(skillInterface.name))
    )
    .find(
      (skillInterface: SkillInterfaceModule) =>
        skillInterface.subcommand === subcommand
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
  skillMap: SkillMap,
  interfaceState: InterfaceState
): ExecutableSkillMethods {
  const { config } = project;
  const configWithDefaults = config.getConfigWithDefaults();
  const configsBasePath = getConfigsBasePath(project);
  const skillsConfigMap: Map<string, ConfigValue> = new Map(
    configWithDefaults.skills.map(([skillPkgName, skillConfig]) => [
      require(skillPkgName).name,
      skillConfig
    ])
  );

  return (
    Array.from(skillMap.values())
      .filter(
        skillNode =>
          skillNode.hooks &&
          skillNode.hooks.run &&
          skillNode.interfaces &&
          skillNode.interfaces.length
      )
      .flatMap(skillNode => {
        const configFiles = skillNode.configFiles.map(configFile => ({
          ...configFile,
          path: path.join(configsBasePath, configFile.filename)
        }));
        return skillNode.interfaces.map(skillInterface => {
          const { subcommand } = require(skillInterface.name);
          const skillConfig = skillsConfigMap.get(
            skillNode.name
          ) as ConfigValue;
          return {
            fn: (flags: Array<string> = []): void =>
              (skillNode.hooks.run as HookFn)({
                data: {
                  subcommand,
                  flags
                },
                skill: skillNode,
                project,
                config,
                configFiles,
                skillMap,
                interfaceState,
                skillConfig
              }),
            // @HACK: If interfaces were defined, we could import the @alfred/interface-*
            //        and use the `subcommand` property. This should be done after we have
            //        some interfaces to work with
            subcommand
          };
        });
      })
      // @TODO @REFACTOR This is messy
      .reduce(
        (
          prevSkill: ExecutableSkillMethods,
          currSkill: { subcommand: string; fn: SubcommandFn }
        ): ExecutableSkillMethods => ({
          ...prevSkill,
          [currSkill.subcommand]: currSkill.fn
        }),
        {}
      )
  );
}
