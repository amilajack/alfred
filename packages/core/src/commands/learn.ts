import mergeConfigs from '@alfred/merge-configs';
import Config from '../config';
import { installDeps, diffCtfDepsOfAllInterfaceStates } from '../ctf';
import { ProjectInterface } from '@alfred/types';

export default async function learn(
  project: ProjectInterface,
  skillsPkgNames: Array<string>
) {
  const { config } = project;

  // Create a alfred config with the new skills added
  const newConfig = new Config(
    mergeConfigs({}, config, { skills: skillsPkgNames })
  );
  // Write the skills to the alfred config in the package.json
  await newConfig.write(project.pkgPath);

  // First install the skills
  const skillInstallationMethod = process.env.IGNORE_INSTALL
    ? 'writeOnly'
    : config.npmClient;
  project.setConfig(newConfig);
  await installDeps(skillsPkgNames, skillInstallationMethod, project);

  // Check if a skill with the same interface is already being used.
  // If so, uninstall it

  // Find the name of the packages that were installed and add the package names to
  // the alfred skills array
  // Find if any new deps need to be installed and install them
  const newSkills = await diffCtfDepsOfAllInterfaceStates(config, newConfig);
  if (newSkills.length) {
    await installDeps(newSkills, skillInstallationMethod, project);
  }
}
