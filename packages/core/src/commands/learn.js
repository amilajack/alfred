import Config from '../config';
import { installDeps, diffCtfDepsOfAllInterfaceStates } from '../ctf';
import { AlfredProject } from '..';

export default async function learn(
  alfredProject: AlfredProject,
  skillsPkgNames: Array<string>
) {
  const { alfredConfig, projectRoot, pkgPath, pkg: rawPkg } = alfredProject;
  const pkg = { ...rawPkg, alfred: { skills: [] } };

  const config = new Config({
    ...pkg,
    alfred: {
      ...pkg.alfred,
      skills: [...(pkg.alfred.skills || []), ...skillsPkgNames]
    }
  });

  // Write the skills to the alfred config in the package.json
  await config.write(pkgPath);

  // Install skills using NPM's API
  const npmClient = !process.env.IGNORE_INSTALL
    ? alfredConfig.npmClient
    : 'writeOnly';
  await installDeps(skillsPkgNames, npmClient, alfredConfig);

  // Check if a skill with the same interface is already being used.
  // If so, uninstall it

  // Find the name of the packages that were installed and add the package names to
  // the alfred skills array
  const { alfredConfig: newAlfredConfig } = await config(projectRoot);

  // Find if any new deps need to be installed and install them
  const newSkills = await diffCtfDepsOfAllInterfaceStates(
    alfredConfig,
    newAlfredConfig
  );
  if (newSkills.length) {
    await installDeps(newSkills, npmClient, alfredConfig);
  }
}
