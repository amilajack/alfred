module.exports = {
  name: 'redux',
  files: [
    {
      name: 'routes',
      path: 'src/routes.js',
      content: `import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createHashHistory } from 'history';
import { routerMiddleware } from 'connected-react-router';
import createRootReducer from '../reducers';
import type { counterStateType } from '../reducers/types';
import { Store, counterStateType } from '../reducers/types';

const history = createHashHistory();
const rootReducer = createRootReducer(history);
const router = routerMiddleware(history);
const enhancer = applyMiddleware(thunk, router);

function configureStore(initialState) {
  return createStore(
    rootReducer,
    initialState,
    enhancer
  );
}

export default { configureStore, history };
`
    }
  ],

  transforms: {
    typescript(skill) {
      skill.files
        .get('routes')
        .applyDiff(
          `@@ -14 +14 @@
-function configureStore(initialState) {
-  return createStore(
+function configureStore(initialState?: counterStateType) {
+ return createStore<*, counterStateType, *>(`
        )
        .rename('routes.ts');
      return skill;
    }
  }
};
