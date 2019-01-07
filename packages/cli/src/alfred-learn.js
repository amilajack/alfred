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
  await installDeps(skills, npmClient);

  // Check if a skill with the same interface is already being used.
  // If so, uninstall it

  // Update the skills in the Alfred config in the package.json
  const { ctf: newCtf, pkg: newPkg } = await generateCtfFromConfig();
  const dedupedSkills = Array.from(new Set([...configSkills, ...skills]));
  const formattedPkg = await formatPkg({
    ...newPkg,
    alfred: {
      ...newPkg.alfred,
      skills: dedupedSkills
    }
  });
  await fs.promises.writeFile(pkgPath, formattedPkg);

  const newSkills = diffCtfDeps(oldCtf, newCtf);

  if (newSkills.length) {
    await installDeps(newSkills);
  }
})();
