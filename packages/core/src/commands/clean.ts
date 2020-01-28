import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import { ProjectInterface } from '@alfred/types';
import { writeMissingDeps } from '.';

export default async function clean(project: ProjectInterface): Promise<void> {
  await writeMissingDeps(project);

  const targetsPath = path.join(project.root, 'targets');
  if (fs.existsSync(targetsPath)) {
    await new Promise(resolve => {
      rimraf(targetsPath, () => {
        resolve();
      });
    });
  }
}
