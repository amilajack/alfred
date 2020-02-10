import path from 'path';
import slash from 'slash';
import { Skills, requireSkill } from '../src/skill';
import VirtualFileSystem from '../src/virtual-file';
import Project from '../src/project';

const reduxSkill = requireSkill('@alfred/skill-redux');

describe('virtual file system', () => {
  let fs;

  const project = new Project(path.join(__dirname, 'fixtures/react-app'));

  const defaultInterfaceState = {
    projectType: 'app',
    env: 'development',
    target: 'browser'
  };

  const file = {
    alias: 'routes',
    dest: 'src/routes.js'
  };

  beforeAll(async () => {
    await project.init();
  });

  beforeEach(() => {
    fs = new VirtualFileSystem();
  });

  it('should delete files', () => {
    fs.add(file);
    expect(fs.values()).not.toEqual([]);
    fs.delete('routes');
    expect(Array.from(fs.values())).toEqual([]);
  });

  it('should rename files', () => {
    fs.add(file)
      .get('routes')
      .rename('routes.ts');
    expect(slash(fs.get('routes').dest)).toEqual('src/routes.ts');
  });

  it('should rename files', () => {
    fs.add(file)
      .get('routes')
      .rename('routes.ts');
    expect(slash(fs.get('routes').dest)).toEqual('src/routes.ts');
  });

  it('should write to file', () => {
    fs.add(file)
      .get('routes')
      .write('console.log(1);');
    expect(fs.get('routes')).toHaveProperty('content', 'console.log(1);');
    fs.get('routes').write('alert(2);');
    expect(fs.get('routes')).toHaveProperty(
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
        defaultInterfaceState
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
          typescript(skill) {
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
        defaultInterfaceState
      );

      expect(skillMap.get('react').files.get('routes').content).toEqual(
        `route 1
route 2
route 3`
      );
    });
  });
});
