import program from 'commander';
import { loadConfig, writeConfig } from '@alfredpkg/core';
import {
  installDeps,
  diffCtfDepsOfAllInterfaceStates,
  getProjectRoot
} from './helpers';

(async () => {
  const args = program.parse(process.argv);
  const { args: skills } = args;
  const projectRoot = getProjectRoot();
  const { pkgPath, alfredConfig } = await loadConfig(projectRoot);

  // Install skills using NPM's API
  const { skills: configSkills = [], npmClient = 'npm' } = alfredConfig;
  configSkills.forEach(skill => {
    if (typeof skill !== 'string') {
      throw new Error(`Type of skill "${skill}" must be a string`);
    }
  });
  await installDeps(skills, npmClient);

  // Check if a skill with the same interface is already being used.
  // If so, uninstall it

  // Find the name of the packages that were installed and add the package names to
  // the alfred skills array
  const { pkg: newPkg, alfredConfig: newAlfredConfig } = await loadConfig(
    projectRoot
  );
  const deps = Object.entries({
    ...newPkg.devDependencies,
    ...newPkg.dependencies
  });
  const skillPkgNames = skills.map(skill => {
    const foundPkg = deps.find(entry => skill === entry[1]);
    if (!foundPkg) {
      throw new Error(`The package name could not be found for "${skill}"`);
    }
    return foundPkg[0];
  });
  const dedupedSkills = Array.from(
    new Set([...configSkills, ...skillPkgNames])
  );

  await writeConfig(pkgPath, {
    ...newPkg,
    alfred: {
      ...newPkg.alfred,
      skills: dedupedSkills
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
