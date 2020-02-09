const path = require('path');
const fs = require('fs');

module.exports = {
  name: 'redux',
  dirs: [
    {
      src: path.join(__dirname, 'boilerplate/actions'),
      dest: 'src/actions'
    }
  ],
  files: [
    {
      alias: 'routes',
      dest: 'src/routes.js',
      content: fs
        .readFileSync(path.join(__dirname, 'boilerplate/routes.jsx'))
        .toString()
    },
    {
      name: 'configureStore.dev',
      dest: 'src/store/configureStore.dev.js',
      content: fs
        .readFileSync(
          path.join(__dirname, 'boilerplate/store/configureStore.dev.js')
        )
        .toString()
    },
    {
      name: 'configureStore.prod',
      dest: 'src/store/configureStore.prod.js',
      content: fs
        .readFileSync(
          path.join(__dirname, 'boilerplate/store/configureStore.prod.js')
        )
        .toString()
    }
  ],
  transforms: {
    typescript(skill) {
      skill.files.get('configureStore.prod').applyDiff(
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
