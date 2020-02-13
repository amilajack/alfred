import fs from 'fs';
import path from 'path';
import slash from 'slash';
import mockFs from 'mock-fs';
import { Skills, requireSkill } from '../src/skill';
import VirtualFileSystem from '../src/virtual-file';
import Project from '../src/project';

const reduxSkill = requireSkill('@alfred/skill-redux');

describe('virtual file system', () => {
  let defaultVfs: VirtualFileSystem;

  const project = new Project(path.join(__dirname, 'fixtures/react-app'));

  const defaultTarget = {
    project: 'app',
    env: 'development',
    platform: 'browser'
  };

  const file = {
    alias: 'routes',
    dest: 'src/routes.js'
  };

  beforeAll(async () => {
    await project.init();
    mockFs({
      [path.join(__dirname, 'fixtures/react-app')]: {
        foo: ''
      }
    });
  });

  afterAll(() => {
    mockFs.restore();
  });

  beforeEach(() => {
    defaultVfs = new VirtualFileSystem();
  });

  it('should delete files', () => {
    defaultVfs.add(file);
    expect(defaultVfs.values()).not.toEqual([]);
    defaultVfs.delete('routes');
    expect(Array.from(defaultVfs.values())).toEqual([]);
  });

  it('should rename files', () => {
    defaultVfs
      .add(file)
      .get('routes')
      .rename('routes.ts');
    expect(slash(defaultVfs.get('routes').dest)).toEqual('src/routes.ts');
  });

  it('should rename files', () => {
    defaultVfs
      .add(file)
      .get('routes')
      .rename('routes.ts');
    expect(slash(defaultVfs.get('routes').dest)).toEqual('src/routes.ts');
  });

  it('should write to file', () => {
    defaultVfs
      .add(file)
      .get('routes')
      .write('console.log(1);');
    expect(defaultVfs.get('routes')).toHaveProperty(
      'content',
      'console.log(1);'
    );
    defaultVfs.get('routes').write('alert(2);');
    expect(defaultVfs.get('routes')).toHaveProperty(
      'content',
      'console.log(1);alert(2);'
    );
  });

  describe('diffs', () => {
    it('should apply diffs', async () => {
      const typescriptSkill = {
        name: 'typescript'
      };
      const skillMap = await Skills(
        project,
        [reduxSkill, typescriptSkill],
        defaultTarget
      );
      expect(
        skillMap.get('redux').files.get('configureStore.prod').content
      ).toEqual(
        `import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createHashHistory } from 'history';
import { routerMiddleware } from 'connected-react-router';
import createRootReducer from '../reducers';

const history = createHashHistory();
const rootReducer = createRootReducer(history);
const router = routerMiddleware(history);
const enhancer = applyMiddleware(thunk, router);

function configureStore(initialState?: counterStateType): Store {
  return createStore(rootReducer, initialState, enhancer);
}

export default { configureStore, history };
`
      );
    });

    it('should apply multiple diffs to file', async () => {
      const typescriptSkill = {
        name: 'typescript'
      };
      const reactSkill = {
        name: 'react',
        files: [
          {
            alias: 'routes',
            dest: 'src/routes',
            content: 'route 1'
          }
        ],
        transforms: {
          typescript(skill): void {
            skill.files.get('routes').applyDiff(
              `@@ -2 +2 @@
+route 2
`
            ).applyDiff(`@@ -3 +3 @@
+route 3`);
            return skill;
          }
        }
      };

      const skillMap = await Skills(
        project,
        [reactSkill, typescriptSkill],
        defaultTarget
      );

      expect(skillMap.get('react').files.get('routes').content).toEqual(
        `route 1
route 2
route 3`
      );
    });

    it('should replace content', async () => {
      const typescriptSkill = {
        name: 'typescript'
      };
      const reactSkill = {
        name: 'react',
        files: [
          {
            alias: 'routes',
            dest: 'src/routes',
            content: 'route 1'
          }
        ],
        transforms: {
          typescript(skill) {
            skill.files.get('routes').replaceContent('route 1', 'route 2');
            return skill;
          }
        }
      };

      const skillMap = await Skills(
        project,
        [reactSkill, typescriptSkill],
        defaultTarget
      );
      expect(skillMap.get('react').files.get('routes')).toHaveProperty(
        'content',
        'route 2'
      );
    });

    describe('condition', () => {
      it('should conditionally add files', async () => {
        const skillWithFileCondition = {
          content: 'foo',
          dest: 'foo',
          condition(): boolean {
            return true;
          }
        };
        const vfs = new VirtualFileSystem();
        vfs.add(skillWithFileCondition);
        expect(vfs.size).toEqual(1);
        jest.spyOn(fs.promises, 'writeFile');
        jest.spyOn(fs.promises, 'mkdir');
        await vfs.writeAllFiles(project);
        expect(fs.promises.writeFile).toHaveBeenCalled();
        fs.promises.writeFile.mockRestore();
        fs.promises.mkdir.mockRestore();
      });

      it('should take project as arg', async () => {
        const skillWithFileCondition = {
          content: 'foo',
          dest: 'foo',
          condition({ project }): boolean {
            return project.targets.length !== 0;
          }
        };
        const vfs = new VirtualFileSystem();
        vfs.add(skillWithFileCondition);
        expect(vfs.size).toEqual(1);
        jest.spyOn(fs.promises, 'writeFile');
        jest.spyOn(fs.promises, 'mkdir');
        await vfs.writeAllFiles(project);
        expect(fs.promises.writeFile).toHaveBeenCalled();
        fs.promises.writeFile.mockRestore();
        fs.promises.mkdir.mockRestore();
      });

      it('should not write if condition false', async () => {
        const skillWithFileCondition = {
          content: 'foo',
          dest: 'foo',
          condition({ project }): boolean {
            return project.target.some(state => state.project === 'lib');
          }
        };
        const vfs = new VirtualFileSystem();
        vfs.add(skillWithFileCondition);
        expect(vfs.size).toEqual(1);
        jest.spyOn(fs.promises, 'writeFile');
        jest.spyOn(fs.promises, 'mkdir');
        await vfs.writeAllFiles(project);
        expect(fs.promises.writeFile).not.toHaveBeenCalled();
        fs.promises.writeFile.mockRestore();
        fs.promises.mkdir.mockRestore();
      });
    });
  });
});
