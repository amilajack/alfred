import program from 'commander';
import { diffCtfDepsOfAllInterfaceStates, Config } from '@alfred/core';
import { writeConfig } from '@alfred/core/lib/config';
import { installDeps, init } from '.';

(async () => {
  const args = program.parse(process.argv);
  const { args: skillsPkgNames } = args;
  const { alfredConfig, projectRoot, pkgPath, pkg: rawPkg } = await init();

  const pkg = { ...rawPkg, alfred: { skills: [] } };

  // Write the skills to the alfred config in the package.json
  await writeConfig(pkgPath, {
    ...pkg,
    alfred: {
      ...pkg.alfred,
      skills: [...(pkg.alfred.skills || []), ...skillsPkgNames]
    }
  });

  // Install skills using NPM's API
  const npmClient = !process.env.IGNORE_INSTALL
    ? alfredConfig.npmClient
    : 'writeOnly';
  await installDeps(skillsPkgNames, npmClient, alfredConfig);

  // Check if a skill with the same interface is already being used.
  // If so, uninstall it

  // Find the name of the packages that were installed and add the package names to
  // the alfred skills array
  const { alfredConfig: newAlfredConfig } = await Config(projectRoot);

  // Find if any new deps need to be installed and install them
  const newSkills = await diffCtfDepsOfAllInterfaceStates(
    alfredConfig,
    newAlfredConfig
  );
  if (newSkills.length) {
    await installDeps(newSkills, npmClient, alfredConfig);
  }
})();
