import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import { ProjectInterface } from '../types';

export default async function clean(project: ProjectInterface) {
  const targetsPath = path.join(project.root, 'targets');
  if (fs.existsSync(targetsPath)) {
    await new Promise(resolve => {
      rimraf(targetsPath, () => {
        resolve();
      });
    });
  }
}
