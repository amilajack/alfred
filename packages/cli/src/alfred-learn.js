import program from 'commander';
import fs from 'fs';
import formatPkg from 'format-package';
import {
  loadConfigs,
  installDeps,
  diffCtfDepsOfAllInterfaceStates
} from './helpers/CTF';

(async () => {
  const args = program.parse(process.argv);
  const { args: skills } = args;
  const { pkgPath, alfredConfig } = await loadConfigs();

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
  const { pkg: newPkg, alfredConfig: newAlfredConfig } = await loadConfigs();
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
  const formattedPkg = await formatPkg({
    ...newPkg,
    alfred: {
      ...newPkg.alfred,
      skills: dedupedSkills
    }
  });
  await fs.promises.writeFile(pkgPath, formattedPkg);

  // Find if any new deps need to be installed and install them
  const newSkills = diffCtfDepsOfAllInterfaceStates(
    alfredConfig,
    newAlfredConfig
  );
  if (newSkills.length) {
    await installDeps(newSkills);
  }
})();
