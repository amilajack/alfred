import program from 'commander';
import { loadConfig, writeConfig } from '@alfredpkg/core';
import { installDeps, diffCtfDepsOfAllInterfaceStates, init } from './helpers';

(async () => {
  const args = program.parse(process.argv);
  const { args: skillsPkgNames } = args;
  const { alfredConfig, projectRoot, pkgPath } = await init();

  // Install skills using NPM's API
  const { npmClient } = alfredConfig;
  await installDeps(skillsPkgNames, npmClient);

  // Check if a skill with the same interface is already being used.
  // If so, uninstall it

  // Find the name of the packages that were installed and add the package names to
  // the alfred skills array
  const { pkg: newPkg, alfredConfig: newAlfredConfig } = await loadConfig(
    projectRoot
  );

  await writeConfig(pkgPath, {
    ...newPkg,
    alfred: {
      ...newPkg.alfred,
      skills: [...newPkg.alfred.skills, ...skillsPkgNames]
    }
  });

  // Find if any new deps need to be installed and install them
  const newSkills = await diffCtfDepsOfAllInterfaceStates(
    alfredConfig,
    newAlfredConfig
  );
  if (newSkills.length) {
    await installDeps(newSkills);
  }
})();
