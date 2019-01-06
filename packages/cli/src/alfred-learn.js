#!/usr/bin/env node
// @flow
import program from 'commander';
import path from 'path';
import fs from 'fs';
import { installDeps } from '@alfredpkg/core';
import generateCtfFromConfig from './helpers/CTF';

(async () => {
  const args = program.parse(process.argv);
  const { args: skills } = args;

  // Install skills using NPM's API
  await installDeps(skills);

  // Check if a skill with the same interface is already being used.
  // If so, uninstall it
  // skills.forEach(skill => {
  // });

  // Update the skills in the Alfred config in the package.json
  const { pkg } = await generateCtfFromConfig();
  const { skills: configSkills = [] } = pkg.alfred;
  const pkgJsonPath = path.join(process.cwd(), 'package.json');
  const dedupedSkills = Array.from(new Set([...configSkills, ...skills]));
  await fs.promises.writeFile(pkgJsonPath, {
    ...pkg,
    alfred: {
      ...pkg.alfred,
      skills: dedupedSkills
    }
  });
})();
