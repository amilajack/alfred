import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import type { Project } from '../types';

export default async function clean(project: Project) {
  const { config } = project;
  const targetsPath = path.join(config.root, 'targets');
  if (fs.existsSync(targetsPath)) {
    await new Promise(resolve => {
      rimraf(targetsPath, () => {
        resolve();
      });
    });
  }
}
