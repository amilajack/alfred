import path from 'path';
import Project from '../src/project';
import { PkgWithDeps, ProjectInterface } from '@alfred/types';
import mock from 'mock-fs';

describe('Project', () => {
  describe('dependencies', () => {
    let depsToInstall: PkgWithDeps;

    beforeEach(async () => {
      const defaultProject = new Project(
        path.join(__dirname, 'fixtures/react-app')
      );
      await defaultProject.init();
      depsToInstall = await defaultProject.findDepsToInstall();
    });

    afterEach(mock.restore);

    it('should find deps to install', () => {
      expect(depsToInstall.devDependencies).not.toHaveProperty('react');
    });

    it('should match snapshot', () => {
      expect(depsToInstall).toEqual({
        devDependencies: {},
        dependencies: {}
      });
    });

    it('should not include deps already in package.json', () => {
      expect(depsToInstall.devDependencies).not.toHaveProperty('react-dom');
    });
  });

  describe('hooks', () => {
    let project: ProjectInterface;

    beforeEach(async () => {
      project = new Project(path.join(__dirname, 'fixtures/react-app'));
      await project.init();
    });

    it('should run before and after hooks for each subcommand', async () => {
      jest.setTimeout(10 ** 4);
      const beforeBuildFn = jest.fn();
      const afterBuildFn = jest.fn();
      project.on('beforeBuild', async () => {
        await beforeBuildFn();
      });
      project.on('afterBuild', async () => {
        await afterBuildFn();
      });
      await project.run('build');
      expect(beforeBuildFn).toHaveBeenCalledTimes(1);
      expect(afterBuildFn).toHaveBeenCalledTimes(1);
    });
  });
});
