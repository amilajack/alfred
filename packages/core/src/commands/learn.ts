import { ProjectInterface } from '@alfred/types';
import mergeConfigs from '@alfred/merge-configs';
import Config from '../config';

export default async function learn(
  project: ProjectInterface,
  skillsPkgNames: Array<string>
): Promise<void> {
  const { config } = project;

  // Create a alfred config with the new skills added
  const newConfig = new Config(
    mergeConfigs({}, config, { skills: skillsPkgNames })
  );

  project.setConfig(newConfig);

  // First install the skills
  await project.installDeps(skillsPkgNames, 'dev');

  // Get dependencies and devDependencies of all skills
  const { dependencies, devDependencies } = await project.findDepsToInstall(
    skillsPkgNames.map(require)
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
}
