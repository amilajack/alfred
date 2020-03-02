import Project from './project';
import { ProjectInterface } from '@alfred/types';

if (typeof jest !== 'undefined') {
  require('source-map-support/register');
}

export default function alfred(projectDir?: string): Promise<ProjectInterface> {
  const project = new Project(projectDir);
  return project.init();
}

// @TODO @REFACTOR Move this to another module
export { formatPkgJson } from './project';
