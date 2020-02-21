import { ProjectInterface, LearnEvent, Skill } from '@alfred/types';
import mergeConfigs from '@alfred/merge-configs';
import Config from '../config';
import { requireSkill } from '../skill';

export default async function learn(
  project: ProjectInterface,
  skillsPkgNames: Array<string>
): Promise<void> {
  const { config } = project;

  const beforeLearnEvent: LearnEvent = {
    skillsPkgNames,
    skills: []
  };
  project.emit('beforeLearn', beforeLearnEvent);

  // Create a alfred config with the new skills added
  const newConfig = new Config(
    mergeConfigs({}, config, { skills: skillsPkgNames })
  );

  project.setConfig(newConfig);

  // First install the skills
  await project.installDeps(skillsPkgNames, 'dev');

  // Get dependencies and devDependencies of all skills
  const skillsToLearn = skillsPkgNames.map(requireSkill);
  const { dependencies, devDependencies } = await project.findDepsToInstall(
    skillsToLearn
  );

  // @TODO Ideally there would be a way to install both devDeps and deps at the same time
  await project.installDeps(dependencies, 'dep');
  await project.installDeps(devDependencies, 'dev');

  // Write the skills to the alfred config in the package.json
  // Run after all installations to preserve atomic behavior of npm and yarn
  await newConfig.write(
    project.pkgPath,
    mergeConfigs({}, project.pkg.alfred || {}, {
      skills: skillsPkgNames
    })
  );

  // Get the entire skillMap now that the skills are installed
  const skillMap = await project.getSkillMap();
  const learnedSkills = skillsToLearn.map(
    skill => skillMap.get(skill.name) as Skill
  );

  const event: LearnEvent = { skillsPkgNames, skills: learnedSkills };
  project.emit('afterLearn', event);
}
