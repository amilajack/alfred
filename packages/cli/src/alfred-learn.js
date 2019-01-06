import program from 'commander';
import fs from 'fs';
import { installDeps, getDevDependencies } from '@alfredpkg/core';
import type { CtfMap } from '@alfredpkg/core';
import generateCtfFromConfig from './helpers/CTF';

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
  await installDeps(skills);

  // Check if a skill with the same interface is already being used.
  // If so, uninstall it

  // Update the skills in the Alfred config in the package.json
  const { ctf: newCtf } = await generateCtfFromConfig();
  const { skills: configSkills = [] } = pkg.alfred;
  const dedupedSkills = Array.from(new Set([...configSkills, ...skills]));
  await fs.promises.writeFile(pkgPath, {
    ...pkg,
    alfred: {
      ...pkg.alfred,
      skills: dedupedSkills
    }
  });

  const newSkills = diffCtfDeps(oldCtf, newCtf);

  if (newSkills.length) {
    await installDeps(newSkills);
  }
})();
