#!/usr/bin/env node
// @flow
import program from 'commander';
import path from 'path';
import fs from 'fs';
import {
  writeConfigsFromCtf,
  CTFS,
  getExecuteWrittenConfigsMethods
} from '@alfredpkg/core';
import type { CtfMap } from '@alfredpkg/core';

(async () => {
  const parsedArguments = program.parse(process.argv);
  const { args: skill }: Array<string> = parsedArguments;

  const pkgJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    throw new Error('Project does not have "package.json"');
  }

  const { dependencies } = await import(pkgJsonPath);

  // Generate the CTF
  const ctf: CtfMap = new Map();
  Object.keys(dependencies || {})
    .filter(dep => dep.includes('alfred-skill-'))
    .map(dep => dep.substring('alfred-skill-'.length))
    .forEach(dep => {
      if (!(dep in CTFS)) {
        throw new Error(`CTF "${dep}" does not exist`);
      }
      ctf.set(dep, CTFS[dep]);
    });

  writeConfigsFromCtf(ctf);
  const commands = getExecuteWrittenConfigsMethods(ctf, {});

  commands[skill]();
})();
