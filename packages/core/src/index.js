// @flow
import Project from './project';

export default function alfred(projectDir?: string) {
  return new Project().init(projectDir);
}
