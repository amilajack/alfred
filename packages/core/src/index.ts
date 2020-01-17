import Project from './project';

export default function alfred(projectDir?: string): Promise<Project> {
  return Promise.resolve(new Project(projectDir));
}

// @TODO @REFACTOR Move this to another module
export { formatPkgJson } from './project';
