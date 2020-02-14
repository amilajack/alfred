import path from 'path';
import { Skill, RawSkill } from '@alfred/types';

const skill: RawSkill = {
  name: 'redux',
  dirs: [
    {
      src: path.join(__dirname, '../boilerplate/actions'),
      dest: 'src/actions'
    },
    {
      src: path.join(__dirname, '../boilerplate/constants'),
      dest: 'src/constants'
    },
    {
      src: path.join(__dirname, '../boilerplate/containers'),
      dest: 'src/containers'
    },
    {
      src: path.join(__dirname, '../boilerplate/components'),
      dest: 'src/components'
    },
    {
      src: path.join(__dirname, '../boilerplate/reducers'),
      dest: 'src/reducers'
    },
    {
      src: path.join(__dirname, '../boilerplate/store'),
      dest: 'src/store'
    }
  ],
  files: [
    {
      src: path.join(__dirname, '../boilerplate/routes.js'),
      dest: 'src/routes.js'
    },
    {
      src: path.join(__dirname, '../boilerplate/app.global.css'),
      dest: 'src/app.global.css'
    },
    {
      alias: 'routes',
      src: path.join(__dirname, '../boilerplate/routes.js'),
      dest: 'src/routes.js'
    },
    {
      src: path.join(__dirname, '../boilerplate/index.js'),
      dest: 'src/app.browser.js'
    },
    {
      alias: 'configureStore.dev',
      src: path.join(__dirname, '../boilerplate/store/configureStore.dev.js'),
      dest: 'src/store/configureStore.dev.js'
    },
    {
      alias: 'configureStore.prod',
      src: path.join(__dirname, '../boilerplate/store/configureStore.prod.js'),
      dest: 'src/store/configureStore.prod.js'
    }
  ],
  transforms: {
    typescript(skill: Skill): Skill {
      skill?.files?.get('configureStore.prod')?.applyDiff(
        `@@ -12 +12 @@
-function configureStore(initialState) {
-  return createStore(rootReducer, initialState, enhancer);
+function configureStore(initialState?: counterStateType): Store {
+  return createStore(rootReducer, initialState, enhancer);`
      );
      return skill;
    }
  }
};

export default skill;
