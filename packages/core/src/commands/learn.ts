import mergeConfigs from '@alfred/merge-configs';
import Config from '../config';
import { diffCtfDepsOfAllInterfaceStates } from '../ctf';
import { ProjectInterface } from '@alfred/types';

export default async function learn(
  project: ProjectInterface,
  skillsPkgNames: Array<string>
): Promise<void> {
  const { config } = project;

  // Create a alfred config with the new skills added
  const newConfig = new Config(
    mergeConfigs({}, config, { skills: skillsPkgNames })
  );

  // First install the skills
  const skillInstallationMethod = process.env.IGNORE_INSTALL
    ? 'writeOnly'
    : config.npmClient;
  project.setConfig(newConfig);
  await project.installDeps(skillsPkgNames, 'dev', skillInstallationMethod);

  // Check if a skill with the same interface is already being used.
  // If so, uninstall it

  // Find the name of the packages that were installed and add the package names to
  // the alfred skills array
  // Find if any new deps need to be installed and install them
  const { diffDeps, diffDevDeps } = await diffCtfDepsOfAllInterfaceStates(
    project,
    config,
    newConfig
  );
  await project.installDeps(diffDevDeps, 'dev', skillInstallationMethod);
  await project.installDeps(diffDeps, 'dep', skillInstallationMethod);

  // Write the skills to the alfred config in the package.json
  // Run after all installations to preserve atomic behavior of npm and yarn
  await newConfig.write(
    project.pkgPath,
    mergeConfigs({}, project.pkg.alfred || {}, {
      skills: skillsPkgNames
    })
  );
}
