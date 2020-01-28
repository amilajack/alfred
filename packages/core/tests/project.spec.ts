import path from 'path';
import Project from '../src/project';

describe('Project', () => {
  describe('dependencies', () => {
    let depsToInstall;

    beforeAll(async () => {
      const defaultProject = new Project(
        path.join(__dirname, 'fixtures/react-app')
      );
      depsToInstall = await defaultProject.findDepsToInstall();
    });

    it('should include skills in config', () => {
      expect(depsToInstall.devDependencies).toHaveProperty('react');
    });

    it('should match snapshot', () => {
      expect(depsToInstall).toMatchSnapshot();
    });

    it('should not include deps already in package.json', () => {
      expect(depsToInstall.devDependencies).not.toHaveProperty('react-dom');
    });
  });
});
