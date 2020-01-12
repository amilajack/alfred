import Project from './project';

export default function alfred(projectDir?: string) {
  return new Project(projectDir);
}

// @TODO @REFACTOR Move this to another module
export { formatPkgJson } from './project';
