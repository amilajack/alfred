import path from 'path';
import slash from 'slash';
import { requireSkill } from '@alfred/helpers';
import { Skills } from '../src/skill';
import VirtualFileSystem from '../src/virtual-file';
import Project from '../src/project';

const reduxSkill = requireSkill('@alfred/skill-redux');

describe('virtual file system', () => {
  let fs;

  const project = new Project(path.join(__dirname, 'fixtures/react-app'));

  const file = {
    name: 'routes',
    path: 'src/routes.js'
  };

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
    expect(slash(fs.get('routes').path)).toEqual('src/routes.ts');
  });

  it('should rename files', () => {
    fs.add(file)
      .get('routes')
      .rename('routes.ts');
    expect(slash(fs.get('routes').path)).toEqual('src/routes.ts');
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
      const skillMap = await Skills(project, [reduxSkill, typescriptSkill], {
        projectType: 'app',
        env: 'development',
        target: 'browser'
      });
      expect(skillMap.get('redux').files.get('configureStore').content).toEqual(
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
  });
});
