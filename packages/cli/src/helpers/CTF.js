import path from 'path';
import fs from 'fs';
import { writeConfigsFromCtf } from '@alfredpkg/core';
import type { CtfMap } from '@alfredpkg/core';

export default async function generateCtfFromConfig() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    throw new Error('Current working directory does not have "package.json"');
  }

  const pkg = JSON.parse((await fs.promises.readFile(pkgPath)).toString());
  if (!('alfred' in pkg)) {
    throw new Error('No Alfred config in "package.json"');
  }
  const { alfred } = pkg;
  if (!alfred.skills) {
    throw new Error('Alfred config does not have `skills` section');
  }

  // Generate the CTF
  const ctf: CtfMap = new Map();
  const { skills = [] } = alfred;
  module.paths.push(`${process.cwd()}/node_modules`);
  skills.forEach(skill => {
    /* eslint-disable */
    const c = require(skill);
    /* eslint-enable */
    ctf.set(c.name, c);
  });
  module.paths.pop();

  // Persist the resulting configs of the CTFs to ./node_modules/.configs or ./configs
  await writeConfigsFromCtf(ctf);

  return { pkg, ctf, pkgPath };
}
