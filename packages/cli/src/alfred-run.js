#!/usr/bin/env node
// @flow
import program from 'commander';
import path from 'path';
import fs from 'fs';
import {
  writeConfigsFromCtf,
  getExecuteWrittenConfigsMethods
} from '@alfredpkg/core';
import type { CtfMap } from '@alfredpkg/core';

(async () => {
  const parsedArguments = program.parse(process.argv);
  const { args: skill } = parsedArguments;

  const pkgJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    throw new Error('Project does not have "package.json"');
  }

  const pkg = await fs.promises.readFile(pkgJsonPath);
  const config = JSON.parse(pkg.toString());
  if (!('alfred' in config)) {
    throw new Error('No configs in "package.json"');
  }

  const { skills = [] } = config.alfred;

  // Generate the CTF
  const ctf: CtfMap = new Map();
  // $FlowFixMe
  module.paths.push(path.join(process.cwd(), 'node_modules'));
  skills.forEach(dep => {
    // $FlowFixMe
    const ctfSkill = require(dep);
    ctf.set(dep, ctfSkill);
  });

  writeConfigsFromCtf(ctf);
  const commands = getExecuteWrittenConfigsMethods(ctf, {});

  commands[skill]();
})();
