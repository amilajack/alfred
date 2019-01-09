import program from 'commander';
import fs from 'fs';
import { getDevDependencies } from '@alfredpkg/core';
import formatPkg from 'format-package';
import type { CtfMap } from '@alfredpkg/core';
import generateCtfFromConfig, { installDeps } from './helpers/CTF';

/**
 * Find all the dependencies that are different between two CTF's.
 * This is used to figure out which deps need to be installed
 */
export default function diffCtfDeps(
  oldCtf: CtfMap,
  newCtf: CtfMap
): Array<string> {
  // Find the dependencies that have changed and install them
  const t: Map<string, string> = new Map();
  const s: Map<string, string> = new Map();

  Object.entries(getDevDependencies(oldCtf)).forEach(([key, val]) => {
    t.set(key, val);
  });
  Object.entries(getDevDependencies(newCtf)).forEach(([key, val]) => {
    if (t.has(key) && t.get(key) !== val) {
      s.set(key, val);
    }
    if (!t.has(key)) {
      s.set(key, val);
    }
  });

  return Array.from(s.entries()).map(([key, val]) => `${key}@${val}`);
}

(async () => {
  const args = program.parse(process.argv);
  const { args: skills } = args;
  const { pkg, pkgPath, ctf: oldCtf } = await generateCtfFromConfig();

  // Install skills using NPM's API
  const { skills: configSkills = [], npmClient = 'npm' } = pkg.alfred;
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
  const { ctf: newCtf, pkg: newPkg } = await generateCtfFromConfig();
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
  const newSkills = diffCtfDeps(oldCtf, newCtf);
  if (newSkills.length) {
    await installDeps(newSkills);
  }
})();
