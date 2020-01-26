import { ProjectInterface } from '@alfred/types';
import mergeConfigs from '@alfred/merge-configs';
import Config from '../config';
import { pkgDepsToList, diffCtfDepsOfAllInterfaceStates } from '../ctf';

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
  const skillInstallationMethod =
    process.env.IGNORE_INSTALL === 'true' ? 'writeOnly' : config.npmClient;
  project.setConfig(newConfig);

  // Get dependencies and devDependencies of all skills
  const { devDependencies, dependencies } = skillsPkgNames
    .map(require)
    .map(({ devDependencies = {}, dependencies = {} }) => ({
      devDependencies,
      dependencies
    }))
    .reduce((prev, curr) => ({ ...prev, ...curr }));

  // Find the name of the packages that were installed and add the package names to
  // the alfred skills array
  // Find if any new deps need to be installed and install them
  const { diffDeps, diffDevDeps } = await diffCtfDepsOfAllInterfaceStates(
    project,
    config,
    newConfig
  );

  // @TODO Ideally there would be a way to install both devDeps and deps at the same time
  await project.installDeps(
    [...skillsPkgNames, ...diffDevDeps, ...pkgDepsToList(devDependencies)],
    'dev',
    skillInstallationMethod
  );
  await project.installDeps(
    [...diffDeps, ...pkgDepsToList(dependencies)],
    'dep',
    skillInstallationMethod
  );

  // Write the skills to the alfred config in the package.json
  // Run after all installations to preserve atomic behavior of npm and yarn
  await newConfig.write(
    project.pkgPath,
    mergeConfigs({}, project.pkg.alfred || {}, {
      skills: skillsPkgNames
    })
  );
}
