/* eslint import/no-dynamic-require: off */
import {
  ProjectInterface,
  Skill,
  SkillMap,
  ConfigValue,
  SkillInterfaceModule,
  HookFn,
  Target
} from '@alfred/types';

export function getSkillInterfaceForSubcommand(
  skillMap: SkillMap,
  subcommand: string
): SkillInterfaceModule {
  const interfaceForSubcommand = Array.from(skillMap.values())
    .flatMap((skill: Skill): SkillInterfaceModule[] =>
      skill.interfaces.map(skillInterface => skillInterface.module)
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

export type SubcommandFn = (flags: Array<string>) => void;

export type ExecutableSkillMethods = {
  [subcommand: string]: SubcommandFn;
};

export function getProjectSubcommands(
  project: ProjectInterface,
  skillMap: SkillMap,
  target: Target
): ExecutableSkillMethods {
  const { config } = project;

  return Array.from(skillMap.values())
    .filter(skill => skill.hooks && skill.interfaces.length)
    .flatMap(skill => {
      return skill.interfaces.map(skillInterface => {
        const skillConfig = skillMap.get(skill.name) as ConfigValue;
        const { subcommand } = skillInterface.module;
        return {
          fn: (flags: Array<string> = []): void =>
            (skill.hooks.run as HookFn)({
              event: {
                subcommand,
                flags,
                target
              },
              project,
              config,
              targets: project.targets,
              skill: skill,
              skillMap,
              skillConfig
            }),
          // @HACK: If interfaces were defined, we could import the @alfred/interface-*
          //        and use the `subcommand` property. This should be done after we have
          //        some interfaces to work with
          subcommand
        };
      });
    })
    .reduce(
      (
        prevSkill: ExecutableSkillMethods,
        currSkill: { subcommand: string; fn: SubcommandFn }
      ): ExecutableSkillMethods => ({
        ...prevSkill,
        [currSkill.subcommand]: currSkill.fn
      }),
      {}
    );
}
